import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import * as png2icons from 'png2icons';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const sourceIcon = join(projectRoot, 'src/assets/icon.jpg');
const iconsDir = join(projectRoot, 'src-tauri/icons');

async function generateIcons() {
  console.log('Generating icons from:', sourceIcon);

  // Define all the sizes needed
  const sizes = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
    { name: 'icon.png', size: 1024 },
    { name: 'Square30x30Logo.png', size: 30 },
    { name: 'Square44x44Logo.png', size: 44 },
    { name: 'Square71x71Logo.png', size: 71 },
    { name: 'Square89x89Logo.png', size: 89 },
    { name: 'Square107x107Logo.png', size: 107 },
    { name: 'Square142x142Logo.png', size: 142 },
    { name: 'Square150x150Logo.png', size: 150 },
    { name: 'Square284x284Logo.png', size: 284 },
    { name: 'Square310x310Logo.png', size: 310 },
    { name: 'StoreLogo.png', size: 50 },
  ];

  // Generate PNG files
  for (const { name, size } of sizes) {
    const outputPath = join(iconsDir, name);
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${name} (${size}x${size})`);
  }

  // Generate ICO file (Windows) - includes multiple sizes
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoPngs = await Promise.all(
    icoSizes.map(async (size) => {
      return await sharp(sourceIcon)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toBuffer();
    })
  );

  const icoBuffer = await pngToIco(icoPngs);
  writeFileSync(join(iconsDir, 'icon.ico'), icoBuffer);
  console.log('Generated: icon.ico');

  // Generate ICNS file (macOS)
  const iconPngPath = join(iconsDir, 'icon.png');
  const iconPngBuffer = readFileSync(iconPngPath);
  const icnsBuffer = png2icons.createICNS(iconPngBuffer, png2icons.BICUBIC2, 0);
  if (icnsBuffer) {
    writeFileSync(join(iconsDir, 'icon.icns'), icnsBuffer);
    console.log('Generated: icon.icns');
  } else {
    console.log('Warning: Could not generate icon.icns');
  }

  console.log('\nIcon generation complete!');
}

generateIcons().catch(console.error);
