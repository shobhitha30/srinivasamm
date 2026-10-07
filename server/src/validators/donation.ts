import { z } from 'zod';

export const donationSchema = z.object({
  campaign_id: z.string().uuid(),
  amount: z.number().positive(),
  donation_type: z.enum(['one_time', 'recurring']),
  is_anonymous: z.boolean().optional()
});