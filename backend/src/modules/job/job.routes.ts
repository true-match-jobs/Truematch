import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { searchJobTitlesHandler } from './job.controller';

export const jobRouter = Router();

jobRouter.get('/titles', asyncHandler(searchJobTitlesHandler));
