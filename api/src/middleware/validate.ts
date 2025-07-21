import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

export const validate =
  (schema: ZodObject) =>
  (
    request: Request,
    response: Response,
    next: NextFunction
  ): Response<any, Record<string, any>> | undefined => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      return response.status(400).json({
        error: 'Bad Request',
        message: 'One or more fields failed validation.',
        issues,
      });
    }

    request.body = result.data;
    next();
  };
