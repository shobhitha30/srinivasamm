import { z } from 'zod';

export const volunteerSchema = z.object({
  location: z.string(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  availability: z.string()
});