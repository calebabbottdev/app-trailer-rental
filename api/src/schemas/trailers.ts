import { z } from 'zod';

export const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  size: z.string().min(1, 'Size is required'),
  is_available: z.boolean().optional().default(true),
});
