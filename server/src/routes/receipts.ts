import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { auth } from '../middleware/auth';

const router = Router();

// Get current user's receipts
router.get('/my', auth, async (req, res) => {
  const user = (req as any).user;

  try {
    const { data, error } = await supabase.from('receipts')
      .select('*, donation:donations(amount, currency, campaign:campaigns(title, orphanage:orphanages(name)))')
      .eq('donor_email', user.email)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      const { data: byDonor } = await supabase.from('donations')
        .select('id')
        .eq('donor_id', user.id);

      if (byDonor && byDonor.length > 0) {
        const donationIds = byDonor.map(d => d.id);
        const { data: receipts } = await supabase.from('receipts')
          .select('*, donation:donations(amount, currency, campaign:campaigns(title, orphanage:orphanages(name)))')
          .in('donation_id', donationIds)
          .order('created_at', { ascending: false });

        return res.json({ success: true, data: receipts || [] });
      }
    }

    res.json({ success: !error, data: data || [], error: error?.message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Download/view a specific receipt
router.get('/:id/download', auth, async (req, res) => {
  const user = (req as any).user;

  try {
    const { data: receipt, error } = await supabase.from('receipts')
      .select('*, donation:donations(amount, currency, donor_id, campaign:campaigns(title, orphanage:orphanages(name)))')
      .eq('id', req.params.id)
      .single();

    if (error || !receipt) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }

    if (receipt.donation?.donor_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const currencySymbol = receipt.currency === 'INR' ? '₹' : '$';
    res.json({
      success: true,
      data: {
        receipt_number: receipt.receipt_number,
        donor_name: receipt.donor_name,
        donor_email: receipt.donor_email,
        amount: receipt.amount,
        currency: receipt.currency,
        currency_symbol: currencySymbol,
        campaign_title: receipt.donation?.campaign?.title || 'General Donation',
        orphanage_name: receipt.donation?.campaign?.orphanage?.name || 'Srinivasam',
        date: receipt.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
