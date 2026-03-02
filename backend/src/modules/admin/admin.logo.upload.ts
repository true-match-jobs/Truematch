import multer from 'multer';
import { AppError } from '../../utils/app-error';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== 'image/png') {
      callback(new AppError(400, 'Only PNG files are allowed'));
      return;
    }

    callback(null, true);
  }
});

export const uploadLogoImage = upload.single('file');
