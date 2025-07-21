import express from 'express';

import { supabase } from '../lib/supabase';
import { validate } from '../middleware/validate';

import { signupSchema, loginSchema } from '../schemas/users';
import { admin } from '../middleware/auth';

const router = express.Router();

router.post('/signup', validate(signupSchema), async (request, response) => {
  const { first_name, last_name, email, password } = request.body;

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

export default router;
