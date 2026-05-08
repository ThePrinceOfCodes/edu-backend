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

export const buildDocumentAiLayoutSummary = (document: any) => {
  const pages = Array.isArray(document?.pages) ? document.pages : [];
  const entities = Array.isArray(document?.entities) ? document.entities : [];
  const formFields = pages.reduce((count: number, page: any) => count + (page?.formFields?.length || 0), 0);
  const tables = pages.reduce((count: number, page: any) => count + (page?.tables?.length || 0), 0);

  return {
    pageCount: pages.length,
    textLength: typeof document?.text === 'string' ? document.text.length : 0,
    formFieldCount: formFields,
    tableCount: tables,
    entityMentions: entities.slice(0, 25).map((entity: any) => ({
      type: entity?.type || '',
      mentionText: entity?.mentionText || '',
      confidence: typeof entity?.confidence === 'number' ? entity.confidence : null,
    })),
  };
};
