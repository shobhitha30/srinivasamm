import { supabase } from '../lib/supabase';

export async function generateReceipt(params: {
  donationId: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
}) {
  const { donationId, donorName, donorEmail, amount, currency } = params;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
  const receiptNumber = `SRN-RCPT-${dateStr}-${randomPart}`;

  try {
    const { data, error } = await supabase.from('receipts').insert({
      donation_id: donationId,
      receipt_number: receiptNumber,
      donor_name: donorName,
      donor_email: donorEmail,
      amount,
      currency: currency || 'INR',
      email_sent: false,
    }).select().single();

    if (error) {
      if (error.code === '23505') {
        const { data: existing } = await supabase.from('receipts')
          .select('*')
          .eq('donation_id', donationId)
          .single();
        return existing;
      }
      console.error('Receipt generation error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Receipt generation exception:', err);
    return null;
  }
}
