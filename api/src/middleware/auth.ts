import 'dotenv/config';

import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabase: SupabaseClient<any, 'public', any> = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const authenticate = async (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<Response<any, Record<string, any>> | undefined> => {
  const token = request.headers.authorization?.split(' ')[1];

  if (!token) {
    return response
      .status(401)
      .json({ error: 'Unauthorized', message: 'No token found.' });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error?.status === 403) {
    return response.status(error.status).json({
      error: 'Forbidden',
      message: 'You are not authorized to perform this action.',
    });
  } else if (!user) {
    return response
      .status(401)
      .json({ error: 'Unauthorized', message: 'No user found.' });
  }

  request.user = user;
  next();
};

export const admin = async (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<Response<any, Record<string, any>> | undefined> => {
  const token = request.headers.authorization?.split(' ')[1];

  if (!token) {
    return response
      .status(401)
      .json({ error: 'Unauthorized', message: 'No token found.' });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return response.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token or user not found.',
    });
  }

  const { data: userRecord, error: userQueryError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (userQueryError || !userRecord || userRecord.role !== 'admin') {
    return response.status(403).json({
      error: 'Forbidden',
      message: 'You are not authorized to perform this action.',
    });
  }

  request.user = userRecord;
  next();
};
