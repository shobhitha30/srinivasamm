import { z } from 'zod';

export const campaignSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  goal_amount: z.number().positive(),
  image_url: z.string().url().optional(),
  start_date: z.string(),
  end_date: z.string()
});