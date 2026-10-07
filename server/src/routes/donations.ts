import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { auth } from '../middleware/auth';
import { generateReceipt } from '../services/receiptService';
import { sendReceiptEmail } from '../services/emailService';
import { logAudit } from '../services/auditService';

const router = Router();

// Create donation + payment record
router.post('/', async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) userId = userData.user.id;
    }

    const { campaign_id, amount, currency, donation_type, is_anonymous } = req.body;

    if (campaign_id) {
      const { data: campaign, error: campError } = await supabase.from('campaigns')
        .select('id, status, orphanage_id')
        .eq('id', campaign_id)
        .single();

      if (campError || !campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }

      if (campaign.status !== 'approved') {
        return res.status(400).json({ success: false, error: 'Campaign is not currently accepting donations' });
      }
    }

    if (donation_type === 'recurring' && !userId) {
      return res.status(401).json({ success: false, error: 'Recurring donations require an account' });
    }

    const { data: donation, error: donError } = await supabase.from('donations').insert({
      donor_id: userId,
      campaign_id,
      amount: parseFloat(amount),
      currency: currency || 'INR',
      donation_type: donation_type || 'one_time',
      is_anonymous: is_anonymous || false,
      status: 'pending',
    }).select().single();

    if (donError || !donation) {
      return res.status(500).json({ success: false, error: donError?.message || 'Failed to create donation' });
    }

    const { data: payment, error: payError } = await supabase.from('payments').insert({
      donation_id: donation.id,
      provider: 'zeffy',
      amount: parseFloat(amount),
      currency: currency || 'INR',
      status: 'pending',
    }).select().single();

    if (payError) {
      console.error('Failed to create payment record:', payError.message);
    }

    res.json({
      success: true,
      data: {
        donation,
        payment,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Zeffy webhook — payment verification
router.post('/webhook', async (req, res) => {
  try {
    const { donation_id, provider_payment_id, payment_method, status } = req.body;

    if (!donation_id) {
      return res.status(400).json({ success: false, error: 'Missing donation_id' });
    }

    const { data: payment, error: payError } = await supabase.from('payments')
      .update({
        provider_payment_id,
        payment_method,
        status: status === 'success' ? 'verified' : 'failed',
        verified_at: status === 'success' ? new Date().toISOString() : null,
      })
      .eq('donation_id', donation_id)
      .select()
      .single();

    if (payError) {
      console.error('Webhook payment update failed:', payError.message);
      return res.status(500).json({ success: false, error: payError.message });
    }

    if (status === 'success') {
      const { data: donation } = await supabase.from('donations')
        .update({ status: 'completed' })
        .eq('id', donation_id)
        .select('*, campaign:campaigns(title, orphanage_id)')
        .single();

      if (donation) {
        // Update campaign raised_amount
        const { data: camp } = await supabase.from('campaigns')
          .select('raised_amount')
          .eq('id', donation.campaign_id)
          .single();

        if (camp) {
          await supabase.from('campaigns')
            .update({ raised_amount: (parseFloat(camp.raised_amount) || 0) + parseFloat(donation.amount) })
            .eq('id', donation.campaign_id);
        }

        // Generate receipt
        let donorName = req.body.donor_name || 'Anonymous';
        let donorEmail = req.body.donor_email;

        if (donation.donor_id) {
          const { data: profile } = await supabase.from('profiles')
            .select('full_name, email')
            .eq('id', donation.donor_id)
            .single();

          if (profile) {
            donorName = profile.full_name || donorName;
            donorEmail = profile.email || donorEmail;
          }
        }

        const receipt = await generateReceipt({
          donationId: donation.id,
          donorName,
          donorEmail: donorEmail || '',
          amount: donation.amount,
          currency: donation.currency,
        });

        if (donorEmail && receipt) {
          await sendReceiptEmail(donorEmail, donorName, receipt);
        }
      }

      await logAudit(null, 'payment_verified', 'payments', payment.id, {
        donation_id,
        provider_payment_id,
        amount: payment.amount,
      });
    } else {
      await supabase.from('donations').update({ status: 'failed' }).eq('id', donation_id);
      await logAudit(null, 'payment_failed', 'payments', payment.id, { donation_id, provider_payment_id });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user's donations
router.get('/my', auth, async (req, res) => {
  const user = (req as any).user;
  const { data, error } = await supabase.from('donations')
    .select('*, campaign:campaigns(title, orphanage:orphanages(name)), payment:payments(status, verified_at), receipt:receipts(receipt_number, receipt_url)')
    .eq('donor_id', user.id)
    .order('created_at', { ascending: false });
  res.json({ success: !error, data, error: error?.message });
});

export default router;
