import { z } from 'zod';

export const orphanageSchema = z.object({
  name: z.string().min(1),
  registration_number: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  children_count: z.number().int().nonnegative(),
  description: z.string(),
  logo_url: z.string().url().optional(),
  website: z.string().url().optional()
});