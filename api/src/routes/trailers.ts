import express, { response } from 'express';

import { supabase } from '../lib/supabase';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { resourceExists } from '../middleware/resource';

import { schema } from '../schemas/trailers';

const router = express.Router();

router.post(
  '/',
  validate(schema),
  authenticate,
  async (request: AuthenticatedRequest, response) => {
    const {
      body: { name, size },
      user,
    } = request;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (userData?.role === 'user') {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to perform this action.',
      });
    }

    const { data, error } = await supabase
      .from('trailers')
      .insert([{ name, size, user_id: user!.id }]);

    if (error || userError) {
      console.error(error);
      return response
        .status(500)
        .json({ error: error?.message || userError?.message });
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

  const activeTrailers = data?.filter(
    (trailer: { active: boolean }) => trailer.active
  );

  response.status(200).json({ data: activeTrailers });
});

router.get('/:id', resourceExists('trailers'), async (request, response) => {
  const { id } = request.params;
  const { data, error } = await supabase
    .from('trailers')
    .select(
      'id, name, size, created_at, active, users (id, first_name, last_name), reservations (id, status, user_id, start_date, end_date, total_cost)'
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }

  const { users, reservations, ...rest } = data;

  const filteredReservations = reservations?.filter(
    (reservation: { status: 'completed' | 'canceled' }) =>
      reservation.status !== 'completed' && reservation.status !== 'canceled'
  );

  response.status(200).json({
    data: {
      ...rest,
      user: users,
      reservations: filteredReservations,
    },
  });
});

router.get(
  '/:id/reservations',
  resourceExists('trailers'),
  authenticate,
  async (request: AuthenticatedRequest, response) => {
    const {
      params: { id },
      user,
    } = request;

    const { data: trailerData, error: trailerError } = await supabase
      .from('trailers')
      .select('*')
      .eq('id', id)
      .single();

    if (trailerError) {
      console.error(trailerError);
      return response
        .status(500)
        .json({ error: 'Failed to fetch trailer info.' });
    }

    if (trailerData.user_id !== user?.id) {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to perform this action.',
      });
    }

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('trailer_id', id);

    if (error) {
      console.error(error);
      return response.status(500).json({ error: error.message });
    }

    response.status(200).json({ data });
  }
);

router.patch(
  '/:id/active',
  authenticate,
  resourceExists('trailers'),
  async (request: AuthenticatedRequest, response) => {
    const { id } = request.params;
    const {
      body: { active },
      user,
    } = request;

    if (typeof active !== 'boolean') {
      return response
        .status(400)
        .json({ error: 'Bad Request', message: '`active` must be a boolean.' });
    }

    const { error } = await supabase
      .from('trailers')
      .update({ active })
      .eq('id', id);

    if (error) {
      console.error(error);
      return response.status(500).json({ error: error.message });
    }

    response.status(204).end();
  }
);

export default router;
