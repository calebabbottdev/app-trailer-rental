import express from 'express';

import { supabase } from '../lib/supabase';
import { validate } from '../middleware/validate';
import { admin, authenticate, AuthenticatedRequest } from '../middleware/auth';

import { signupSchema, loginSchema } from '../schemas/users';

const router = express.Router();

router.post('/signup', validate(signupSchema), async (request, response) => {
  const { first_name, last_name, date_of_birth, email, password } =
    request.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error?.status === 422) {
    console.error(error);
    return response.status(422).json({
      error: 'Unprocessable Entity',
      message: 'This email is already in use.',
    });
  } else if (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }

  await supabase.from('users').insert([
    {
      id: data.user!.id,
      first_name,
      last_name,
      date_of_birth,
      email,
    },
  ]);

  response.status(201).json({ data });
});

router.post('/login', validate(loginSchema), async (request, response) => {
  const { email, password } = request.body;

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error?.status === 400 && error.code === 'invalid_credentials') {
    console.error(error);
    return response
      .status(400)
      .json({ error: 'Bad Request', message: 'Invalid credentials.' });
  } else if (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }

  response.status(200).json({ data });
});

router.get('/', admin, async (_request, response) => {
  const { data, error } = await supabase.from('users').select('*');

  if (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }

  response.status(200).json({ data });
});

router.get(
  '/:id/reservations',
  authenticate,
  async (request: AuthenticatedRequest, response) => {
    const {
      params: { id },
      user,
    } = request;

    if (id !== user?.id) {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to perform this action.',
      });
    }

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', id);

    if (error) {
      console.error(error);
      return response.status(500).json({ error: error.message });
    }

    response.status(200).json({ data });
  }
);

router.get('/:id/trailers', async (request, response) => {
  const { id } = request.params;
  const { data, error } = await supabase
    .from('trailers')
    .select('*')
    .eq('user_id', id);

  if (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }

  response.status(200).json({ data });
});

export default router;
