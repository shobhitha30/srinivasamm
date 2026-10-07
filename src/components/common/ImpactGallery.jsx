import React from 'react';

const SAMPLE_IMPACT_ITEMS = [
  {
    id: 'imp-1',
    title: 'Textbook & Stationary Delivery',
    date: 'February 2026',
    cause: 'Sri Anantha Children Home',
    description: '48 sets of school textbooks, notebooks, and geometry boxes were delivered directly from Royal Stationers, Hyderabad.',
    receiptInfo: 'Invoice #RS-8891 • Paid $350 USD',
    image: ''
  },
  {
    id: 'imp-2',
    title: 'Monthly Rice & Grocery Supply',
    date: 'February 2026',
    cause: 'Sri Anantha Children Home',
    description: '10 bags (500kg total) of Grade-A Sona Masoori rice and 50kg pulses delivered.',
    receiptInfo: 'Invoice #VTR-204 • Paid $240 USD',
    image: ''
  },
  {
    id: 'imp-3',
    title: 'New Mattress & Blanket Distribution',
    date: 'January 2026',
    cause: 'Vatsalya Children Haven',
    description: 'Replacing old bedding with 25 clean, waterproof mattresses and warm fleece blankets.',
    receiptInfo: 'Invoice #HL-4410 • Paid $520 USD',
    image: ''
  }
];

export function ImpactGallery() {
  return (
    <div className="card p-2xl mb-2xl bg-white border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-xl border-b pb-md">
        <div>
          <span className="badge badge-success mb-xs">Transparent Verification</span>
          <h2 className="text-2xl font-extrabold text-heading">Live Delivery & Impact Proof</h2>
          <p className="text-muted text-sm">Every dollar donated is tracked with supplier invoices and delivery proof.</p>
        </div>
        <span className="text-xs text-muted font-mono mt-xs sm:mt-0">100% Direct Transfer</span>
      </div>

      <div className="grid grid-1 md:grid-3 gap-lg">
        {SAMPLE_IMPACT_ITEMS.map((item) => (
          <div key={item.id} className="bg-subtle p-lg rounded-xl border flex flex-col justify-between hover:shadow-sm transition">
            <div>
              <div className="text-4xl mb-sm">{item.image}</div>
              <span className="text-xs text-muted font-medium">{item.date} • {item.cause}</span>
              <h3 className="text-md font-bold mb-xs text-heading mt-1">{item.title}</h3>
              <p className="text-xs text-muted leading-relaxed mb-md">{item.description}</p>
            </div>

            <div className="pt-sm border-t border-subtle text-xs font-mono text-primary font-semibold">
               {item.receiptInfo}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
