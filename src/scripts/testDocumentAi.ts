import 'dotenv/config';
import { processDocument } from '../modules/attendant-extraction/document-ai.service';

const filePath = process.argv[2];

const run = async () => {
  if (!filePath) {
    throw new Error('Usage: tsx src/scripts/testDocumentAi.ts <file-path>');
  }

  const document = await processDocument(filePath);
  console.log(JSON.stringify(document, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
