import express from 'express';

import { supabase } from '../lib/supabase';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

import { schema } from '../schemas/trailers';

const router = express.Router();

router.post(
  '/',
  validate(schema),
  authenticate,
  async (request: AuthenticatedRequest, response) => {
    const {
      body: { name, size, is_available = true },
      user,
    } = request;

    const { data, error } = await supabase
      .from('trailers')
      .insert([{ name, size, is_available, user_id: user!.id }]);

    if (error) {
      console.error(error);
      return response.status(500).json({ error: error.message });
    }

    response.status(201).json({ data });
  }
);

router.get('/', async (_request, response) => {
  const { data, error } = await supabase.from('trailers').select('*');

  if (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }

  response.status(200).json({ data });
});

router.get('/:id', async (request, response) => {
  const { id } = request.params;
  const { data, error } = await supabase
    .from('trailers')
    .select('*')
    .eq('id', id)
    .single();

  if (
    error?.code === 'PGRST116' &&
    error?.message === 'JSON object requested, multiple (or no) rows returned'
  ) {
    return response
      .status(400)
      .json({ error: 'Bad Request', message: `Resource: ${id} not found.` });
  } else if (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }

  response.status(200).json({ data });
});

export default router;
