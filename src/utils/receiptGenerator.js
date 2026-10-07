/**
 * receiptGenerator.js — Generates a printable 501(c)(3) & 80G Tax Receipt for Srinivasam donors.
 */
export function generateTaxReceipt({ donationId, donorName, email, causeName, amount, currency = 'USD', date }) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
  const receiptNum = `SRN-TAX-${(donationId || Date.now().toString()).slice(-8).toUpperCase()}`;
  const currSymbol = currency === 'USD' ? '$' : '$';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Official Tax Receipt — ${receiptNum}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; background: #ffffff; }
        .header { border-bottom: 3px solid #047857; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .brand-logo { font-size: 26px; font-weight: 800; color: #047857; letter-spacing: -0.03em; }
        .receipt-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .meta-box { background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px; }
        .meta-value { font-size: 15px; font-weight: 700; color: #0f172a; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th { background: #f1f5f9; text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
        .table td { padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .total-row { font-size: 20px; font-weight: 800; color: #047857; }
        .footer { margin-top: 50px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; }
        .stamp { display: inline-block; padding: 6px 14px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 12px; font-weight: 700; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-logo">Srinivasam 2.0</div>
          <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Direct & Transparent Orphan Care Platform</div>
        </div>
        <div style="text-align: right;">
          <div class="receipt-title">Official Donation Receipt</div>
          <div style="font-size: 14px; font-weight: 700; color: #047857; margin-top: 4px;">${receiptNum}</div>
          <div style="font-size: 12px; color: #64748b;">Issued: ${formattedDate}</div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-box">
          <div class="meta-label">Donor Information</div>
          <div class="meta-value">${donorName || 'Generous Donor'}</div>
          <div style="font-size: 13px; color: #64748b; margin-top: 2px;">${email || 'Registered Donor'}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Tax Exemption Status</div>
          <div class="stamp"> 100% Tax-Deductible Contribution</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">501(c)(3) US & 80G India Certified • 0% Fee Platform</div>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description / Supported Non-Profit</th>
            <th>Payment Method</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${causeName || 'Sri Anantha Children Home — General Support'}</strong>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Direct support for children nutrition, education, and healthcare</div>
            </td>
            <td>Online Card Payment (Zeffy 0% Fee Gateway)</td>
            <td style="text-align: right;" class="total-row">${currSymbol}${amount} ${currency}</td>
          </tr>
        </tbody>
      </table>

      <div style="background: #f8fafc; padding: 20px; border-radius: 10px; font-size: 13px; color: #334155; border-left: 4px solid #047857;">
        <strong>Tax Exemption Disclosure Notice:</strong> No goods or services were provided in exchange for this contribution. Srinivasam certifies that 100% of these funds are transferred directly to verified partner orphanages. Please retain this document for tax deduction filing.
      </div>

      <div class="footer">
        <div>Srinivasam Platform Foundation • Building Transparent Orphan Care</div>
        <div>Questions or receipt inquiries? Email <strong>support@srinivasam.org</strong></div>
      </div>

      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
