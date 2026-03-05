import { promises as fs } from 'node:fs';
import path from 'node:path';

const LOGO_DIRECTORY = path.resolve(process.cwd(), '../frontend/public/logos');
const LOGO_FILE_PATH = path.join(LOGO_DIRECTORY, 'logo-tm.png');

export const saveNavbarLogo = async (file: Express.Multer.File): Promise<string> => {
  await fs.mkdir(LOGO_DIRECTORY, { recursive: true });
  await fs.writeFile(LOGO_FILE_PATH, file.buffer);

  return '/logos/logo-tm.png';
};
