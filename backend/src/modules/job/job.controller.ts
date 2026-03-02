import type { Request, Response } from 'express';
import { searchJobTitles } from './job.service';

export const searchJobTitlesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = typeof req.query.query === 'string' ? req.query.query : '';
    const titles = await searchJobTitles(query);

    res.status(200).json({
      titles
    });
  } catch {
    res.status(200).json({
      titles: []
    });
  }
};
