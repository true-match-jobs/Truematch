import type { Request, Response } from 'express';
import { searchCourseTypes } from './course.service';

export const searchCourseTypesHandler = async (req: Request, res: Response): Promise<void> => {
  const query = typeof req.query.query === 'string' ? req.query.query : '';
  const types = await searchCourseTypes(query);

  res.status(200).json({
    types
  });
};
