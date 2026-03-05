import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { searchUniversityNamesHandler } from './university.controller';

export const universityRouter = Router();

universityRouter.get('/names', asyncHandler(searchUniversityNamesHandler));
