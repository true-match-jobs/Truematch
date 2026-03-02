import multer from 'multer';
import { AppError } from '../../utils/app-error';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    const isImage = file.mimetype.startsWith('image/');

    if (!isImage) {
      callback(new AppError(400, 'Only image files are allowed'));
      return;
    }

    callback(null, true);
  }
});

export const uploadProfilePhoto = upload.single('file');
