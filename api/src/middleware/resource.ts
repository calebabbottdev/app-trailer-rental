import { Request, Response, NextFunction } from 'express';

import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

type Table = 'users' | 'trailers' | 'reservations';

export const resourceExists =
  (table: Table) =>
  async (
    request: AuthenticatedRequest | Request,
    response: Response,
    next: NextFunction
  ): Promise<Response<any, Record<string, any>> | undefined> => {
    const { id } = request.params;
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (
      error?.code === 'PGRST116' &&
      error?.message === 'JSON object requested, multiple (or no) rows returned'
    ) {
      return response.status(404).json({
        error: 'Not Found',
        message: `Resource: ${id} not found.`,
      });
    } else if (error) {
      console.error(error);
      return response
        .status(500)
        .json({ error: 'An unexpected error occurred.' });
    }

    // Unexpected side effects when patching
    // request.body = data;
    next();
  };
