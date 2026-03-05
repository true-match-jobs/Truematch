import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const sourceLogo = path.join(publicDir, 'logos', 'logo-tm.png');

const readLogo = async () => {
  try {
    await fs.access(sourceLogo);
  } catch {
    throw new Error(`Source logo not found at ${sourceLogo}`);
  }

  return sharp(sourceLogo).ensureAlpha();
};

const createPngIcon = async (outputName, size) => {
  const output = path.join(publicDir, outputName);

  await (await readLogo())
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(output);

  return output;
};

const createSocialPreview = async () => {
  const socialWidth = 1200;
  const socialHeight = 630;
  const logoTargetWidth = 430;

  const logoBuffer = await (await readLogo())
    .resize(logoTargetWidth, logoTargetWidth, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .png()
    .toBuffer();

  const output = path.join(publicDir, 'social-preview.png');

  await sharp({
    create: {
      width: socialWidth,
      height: socialHeight,
      channels: 4,
      background: { r: 9, g: 9, b: 11, alpha: 1 }
    }
  })
    .composite([
      {
        input: logoBuffer,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(output);

  return output;
};

const createFaviconIco = async () => {
  const icon32 = await (await readLogo())
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const icon16 = await (await readLogo())
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const ico = await pngToIco([icon16, icon32]);
  const output = path.join(publicDir, 'favicon.ico');
  await fs.writeFile(output, ico);
  return output;
};

const createWebManifest = async () => {
  const manifest = {
    name: 'TrueMatch',
    short_name: 'TrueMatch',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    theme_color: '#09090b',
    background_color: '#09090b',
    display: 'standalone'
  };

  const output = path.join(publicDir, 'site.webmanifest');
  await fs.writeFile(output, JSON.stringify(manifest, null, 2));
  return output;
};

const run = async () => {
  await fs.mkdir(path.join(publicDir, 'logos'), { recursive: true });

  const generated = [];
  generated.push(await createPngIcon('favicon-16x16.png', 16));
  generated.push(await createPngIcon('favicon-32x32.png', 32));
  generated.push(await createPngIcon('apple-touch-icon.png', 180));
  generated.push(await createPngIcon('android-chrome-192x192.png', 192));
  generated.push(await createPngIcon('android-chrome-512x512.png', 512));
  generated.push(await createSocialPreview());
  generated.push(await createFaviconIco());
  generated.push(await createWebManifest());

  console.log('Generated logo assets:');
  generated.forEach((file) => console.log(`- ${path.relative(root, file)}`));
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
