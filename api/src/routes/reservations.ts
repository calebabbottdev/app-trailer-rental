import express from 'express';

import { supabase } from '../lib/supabase';
import { validate } from '../middleware/validate';
import { admin, authenticate, AuthenticatedRequest } from '../middleware/auth';
import { resourceExists } from '../middleware/resource';

import { schema, status } from '../schemas/reservations';

const router = express.Router();

router.post(
  '/',
  validate(schema),
  authenticate,
  async (request: AuthenticatedRequest, response) => {
    const {
      body: { trailer_id, start_date, end_date, total_cost },
      user,
    } = request;

    const { data: trailer, error: trailerError } = await supabase
      .from('trailers')
      .select('user_id')
      .eq('id', trailer_id)
      .single();

    if (trailerError) {
      console.error(trailerError);
      return response
        .status(500)
        .json({ error: 'Failed to fetch trailer info.' });
    }

    if (trailer.user_id === user!.id) {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'You cannot reserve your own trailer.',
      });
    }

    const { data: conflicts, error: conflictError } = await supabase
      .from('reservations')
      .select('*')
      .eq('trailer_id', trailer_id)
      .in('status', ['pending', 'confirmed'])
      .lte('start_date', end_date.toISOString())
      .gte('end_date', start_date.toISOString());

    if (conflictError) {
      console.error(conflictError);
      return response.status(500).json({ error: 'Conflict check failed.' });
    }

    if (conflicts && conflicts.length > 0) {
      return response.status(409).json({
        error: 'Conflict',
        message: 'A reservation already exists at the dates specified.',
      });
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert([
        { trailer_id, start_date, end_date, total_cost, user_id: user!.id },
      ]);

    if (error) {
      console.error(error);
      return response.status(500).json({ error: error.message });
    }

    response.status(201).json({ data });
  }
);

router.get('/', admin, async (_request, response) => {
  const { data, error } = await supabase.from('reservations').select('*');

  if (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }

  response.status(200).json({ data });
});

router.get(
  '/:id',
  resourceExists('reservations'),
  async (request, response) => {
    const { id } = request.params;
    const { data, error } = await supabase
      .from('reservations')
      .select(
        'start_date, end_date, status, total_cost, trailers (id, name, size, user_id), users (id, first_name, last_name)'
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      return response.status(500).json({ error: error.message });
    }

    const { trailers, users, ...rest } = data;

    response.status(200).json({
      data: {
        ...rest,
        trailer: trailers,
        user: users,
      },
    });
  }
);

router.patch(
  '/:id/status',
  validate(status),
  authenticate,
  resourceExists('reservations'),
  async (request: AuthenticatedRequest, response) => {
    const { id } = request.params;
    const {
      body: { status },
    } = request;

    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error(error);
      return response.status(500).json({ error: error.message });
    }

    response.status(204).end();
  }
);

// Add item to request from resourceExists() to assume trailer_id, status etc
// to avoid double querying
router.post(
  '/:id/reviews',
  authenticate,
  resourceExists('reservations'),
  async (request: AuthenticatedRequest, response) => {
    const { id } = request.params;
    const {
      body: { trailer_id, rating, comment },
      user,
    } = request;

    const { data, error } = await supabase
      .from('reviews')
      .insert([{ trailer_id: id, rating, comment, user_id: user!.id }]);

    if (error) {
      console.error(error);
      return response.status(500).json({ error: error.message });
    }

    response.status(201).json({ data });
  }
);

export default router;
