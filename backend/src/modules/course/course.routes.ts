import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { searchCourseTypesHandler } from './course.controller';

export const courseRouter = Router();

courseRouter.get('/types', asyncHandler(searchCourseTypesHandler));
