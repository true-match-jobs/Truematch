import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { applicationRouter } from './modules/application/application.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { authRouter } from './modules/auth/auth.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { courseRouter } from './modules/course/course.routes';
import { jobRouter } from './modules/job/job.routes';
import { universityRouter } from './modules/university/university.routes';
import { userRouter } from './modules/user/user.routes';
import { errorMiddleware } from './middleware/error.middleware';

export const app = express();

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/+$/, '').toLowerCase();

const allowedOrigins = env.FRONTEND_ORIGIN.split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter((origin) => origin.length > 0);

app.use(helmet());
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      const normalizedRequestOrigin = normalizeOrigin(requestOrigin);

      if (allowedOrigins.includes(normalizedRequestOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/applications', applicationRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/universities', universityRouter);

app.use(errorMiddleware);
