import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export const preprocessAttendantImage = async (sourcePath: string) => {
  const dir = path.dirname(sourcePath);
  const base = path.basename(sourcePath, path.extname(sourcePath));
  const outputPath = path.join(dir, `${base}-preprocessed.png`);

  try {
    const image = sharp(sourcePath);
    const metadata = await image.metadata();

    const scaleFactor = metadata.width && metadata.width < 2000 ? 3 : 2;
    const targetWidth = metadata.width ? metadata.width * scaleFactor : 2400;

    await image
      .rotate() 
      .grayscale() 
      .resize({
        width: targetWidth,
        kernel: sharp.kernel.lanczos3, 
        withoutEnlargement: false,
      })
      .normalize() 
      .median(3) 
      .linear(1.35, -25) 
      .gamma(1.3) 
      .sharpen({ sigma: 1.5, m1: 2.0, m2: 3.5 })
      .png({ compressionLevel: 6 }) 
      .toFile(outputPath);
  } catch {
    await fs.copyFile(sourcePath, outputPath);
  }

  await fs.access(outputPath);
  return outputPath;
};
