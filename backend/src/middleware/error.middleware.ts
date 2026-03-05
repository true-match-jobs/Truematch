import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';
import { ZodError } from 'zod';
import { env } from '../config/env';

export const errorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Validation error',
      errors: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
    return;
  }

  if (error instanceof Error) {
    // Log errors in all environments
    const timestamp = new Date().toISOString();
    const errorLog = {
      timestamp,
      name: error.name,
      message: error.message,
      stack: env.NODE_ENV === 'production' ? undefined : error.stack
    };
    console.error(JSON.stringify(errorLog));

    // Don't expose internal error details in production
    const responseMessage = env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;

    res.status(500).json({ message: responseMessage });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};
