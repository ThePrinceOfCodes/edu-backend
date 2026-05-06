import fs from 'fs/promises';
import path from 'path';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import config from '../../config/config';

const client = new DocumentProcessorServiceClient();

const mimeTypeFromPath = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.pdf': 'application/pdf',
  };
  return map[ext] ?? 'image/jpeg';
};

export const processDocument = async (filePath: string, mimeType?: string) => {
  const resolvedMimeType = mimeType ?? mimeTypeFromPath(filePath);
  if (!config.googleDocumentAi.projectId || !config.googleDocumentAi.location || !config.googleDocumentAi.processorId) {
    throw new Error('Google Document AI config is missing');
  }

  const name = `projects/${config.googleDocumentAi.projectId}/locations/${config.googleDocumentAi.location}/processors/${config.googleDocumentAi.processorId}`;
  const file = await fs.readFile(filePath);
  const encodedImage = Buffer.from(file).toString('base64');

  const request = {
    name,
    rawDocument: {
      content: encodedImage,
      mimeType: resolvedMimeType,
    },
  };

  const [result] = await client.processDocument(request as any, {
    timeout: 600000,
  } as any);
  return result.document;
};
