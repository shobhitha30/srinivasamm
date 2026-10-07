/**
 * Demo / Placeholder dataset for visual development.
 * Structured clearly as demo data so it can be seamlessly replaced by live Supabase queries.
 */

export const DEMO_IMPACT_SUMMARY = {
  totalDonated: 0,
  causesSupported: 0,
  isDemo: true,
};

export const DEMO_OCCASIONS = [
  {
    id: 'occ-1',
    title: 'Upcoming Birthday',
    date: 'October 18',
    type: 'Birthday',
    message: 'Make your birthday memorable by sponsoring warm meals for children.',
    suggestedAmount: 50,
  },
  {
    id: 'occ-2',
    title: 'Wedding Anniversary',
    date: 'December 12',
    type: 'Anniversary',
    message: 'Celebrate your special day together by supporting education supplies.',
    suggestedAmount: 100,
  },
];

export const DEMO_CAUSES = [
  {
    id: 'cause-1',
    title: 'Sri Sai Ananda Orphanage & Care',
    location: 'Hyderabad, Telangana, India',
    verificationStatus: 'verified',
    category: 'Food & Nutrition',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
    description: 'Providing daily nutritious meals, clean water, and healthcare for 65 resident children.',
    impactOptions: [
      { amount: 25, label: '$25 can provide daily meals for 5 children' },
      { amount: 50, label: '$50 supports weekly grocery & essential needs' },
      { amount: 100, label: '$100 covers medical checkups & nutrition for a month' }
    ],
    goal: 5000,
    raised: 3450,
  },
  {
    id: 'cause-2',
    title: 'Vatsalya Children Learning Foundation',
    location: 'Bengaluru, Karnataka, India',
    verificationStatus: 'verified',
    category: 'Education & Books',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
    description: 'Empowering underprivileged youth with school supplies, uniforms, and digital literacy tools.',
    impactOptions: [
      { amount: 30, label: '$30 provides school uniform & backpack' },
      { amount: 60, label: '$60 funds textbook sets for 3 students' },
      { amount: 120, label: '$120 sponsors a child\'s annual learning kits' }
    ],
    goal: 4000,
    raised: 2800,
  },
  {
    id: 'cause-3',
    title: 'Aashraya Winter Clothing & Shelter Drive',
    location: 'Jaipur, Rajasthan, India',
    verificationStatus: 'verified',
    category: 'Clothing & Shelter',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
    description: 'Ensuring safe bedding, warm winter blankets, and essential apparel for orphaned infants.',
    impactOptions: [
      { amount: 20, label: '$20 supplies warm sweaters and socks' },
      { amount: 50, label: '$50 provides thermal blankets and bedding' },
      { amount: 100, label: '$100 funds winter protection packages for 10 kids' }
    ],
    goal: 3000,
    raised: 2100,
  }
];

export const DEMO_DONATIONS = [
  // Empty array initially so new accounts start with clean state, or can show demo records
];
