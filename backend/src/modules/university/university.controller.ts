import type { Request, Response } from 'express';
import { searchUniversityNames } from './university.service';

export const searchUniversityNamesHandler = async (req: Request, res: Response): Promise<void> => {
  const query = typeof req.query.query === 'string' ? req.query.query : '';
  const country = typeof req.query.country === 'string' ? req.query.country : undefined;
  const names = await searchUniversityNames(query, country);

  res.status(200).json({
    names
  });
};
