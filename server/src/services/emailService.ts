import { Resend } from 'resend';
import { env } from '../config/env';
import { supabase } from '../lib/supabase';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendReceiptEmail(
  toEmail: string,
  donorName: string,
  receipt: any
) {
  if (!resend) {
    console.warn('Resend API key not configured. Skipping email.');
    return;
  }

  try {
    const currencySymbol = receipt.currency === 'INR' ? '₹' : '$';

    await resend.emails.send({
      from: 'Srinivasam <receipts@srinivasam.org>',
      to: toEmail,
      subject: `Donation Receipt — ${receipt.receipt_number}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a5c2e;">Thank You for Your Donation!</h2>
          <p>Dear ${donorName},</p>
          <p>We have received your generous donation. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Receipt Number</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${receipt.receipt_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Amount</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${currencySymbol}${receipt.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Date</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(receipt.created_at).toLocaleDateString('en-IN')}</td>
            </tr>
          </table>
          <p>This receipt may be used for tax exemption purposes under Section 80G of the Income Tax Act.</p>
          <p style="color: #6b7280; font-size: 0.875rem;">
            Srinivasam — Empowering Children, Transforming Futures.
          </p>
        </div>
      `,
    });

    await supabase.from('receipts')
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq('id', receipt.id);

    console.log(`Receipt email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send receipt email:', err);
  }
}
