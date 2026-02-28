import multer from 'multer';
import { AppError } from '../../utils/app-error';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    const isPdf = file.mimetype === 'application/pdf';
    const isImage = file.mimetype.startsWith('image/');

    if (!isPdf && !isImage) {
      callback(new AppError(400, 'Only PDF and image files are allowed'));
      return;
    }

    callback(null, true);
  }
});

export const uploadApplicationDocument = upload.single('file');
