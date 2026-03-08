import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

export const verifyContractApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const authorizationHeader = req.header('authorization');

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token || token !== env.CONTRACT_API_KEY) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  next();
};
