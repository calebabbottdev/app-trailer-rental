import { z } from 'zod';

export const schema = z.object({
  trailer_id: z.uuid({ message: 'Trailer ID must be a valid UUID' }),
  start_date: z.coerce.date({ message: 'Start date is required' }),
  end_date: z.coerce.date({ message: 'End date is required' }),
  total_cost: z.coerce.number().min(1, 'Total cost must be greater than 0'),
});

export const status = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'canceled']),
});
