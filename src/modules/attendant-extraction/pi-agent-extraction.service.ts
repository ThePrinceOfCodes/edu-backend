import fs from 'fs/promises';
import config from '../../config/config';
import { ApiError } from '../errors';
import { logger } from '../logger';
import { getPiOAuthApiKey, getRuntimePiOAuthProviderId } from './pi-oauth.service';
import {
  ATTENDANCE_EXTRACTION_PROMPT,
  ATTENDANCE_EXTRACTION_PROMPT_VERSION,
  ATTENDANCE_EXTRACTION_REPAIR_PROMPT,
} from './prompts';

type PiExtractionInput = {
  imagePath: string;
  mimeType: string;
  documentAiText: string;
  documentAiLayoutSummary: Record<string, any>;
};

type PiExtractionResult = {
  rawResponse: string;
  provider: string;
  model: string;
  promptVersion: string;
};

const resolveModel = async (modelRegistry: any) => {
  const oauthProvider = getRuntimePiOAuthProviderId();
  if (oauthProvider === 'openai-codex') {
    const codexModel = modelRegistry.find('openai-codex', 'gpt-5.3-codex');
    if (!codexModel) {
      throw new ApiError(500, "Configured Pi model 'openai-codex/gpt-5.3-codex' was not found");
    }

    return codexModel;
  }

  const configuredProvider = config.attendanceExtraction.provider;
  const configuredModel = config.attendanceExtraction.model;

  if (configuredProvider && configuredModel) {
    const explicitModel = modelRegistry.find(configuredProvider, configuredModel);
    if (!explicitModel) {
      throw new ApiError(500, `Configured Pi model '${configuredProvider}/${configuredModel}' was not found`);
    }
    return explicitModel;
  }

  const availableModels = modelRegistry.getAvailable().filter((model: any) => Array.isArray(model.input) && model.input.includes('image'));
  const providerFilteredModels = configuredProvider
    ? availableModels.filter((model: any) => model.provider === configuredProvider)
    : availableModels;

  const selectedModel = providerFilteredModels[0];
  if (!selectedModel) {
    throw new ApiError(500, 'No vision-capable Pi model is available with configured backend API keys');
  }

  return selectedModel;
};

const createPrompt = (input: PiExtractionInput) => {
  const context = {
    document_ai_text: input.documentAiText,
    document_ai_layout_summary: input.documentAiLayoutSummary,
  };

  return `${ATTENDANCE_EXTRACTION_PROMPT}\n\nOCR and layout context:\n${JSON.stringify(context)}`;
};

const createImagePayload = async (imagePath: string, mimeType: string) => {
  const imageBuffer = await fs.readFile(imagePath);
  return {
    type: 'image' as const,
    data: imageBuffer.toString('base64'),
    mimeType,
  };
};

const loadPiSdk = async (): Promise<any> => new Function('return import("@earendil-works/pi-coding-agent")')();

const createPiSession = async () => {
  const sdk = await loadPiSdk();
  const authStorage = sdk.AuthStorage.create();

  const oauthKey = await getPiOAuthApiKey();
  const oauthProvider = getRuntimePiOAuthProviderId();

  if (oauthKey && oauthProvider) {
    authStorage.setRuntimeApiKey(oauthProvider, oauthKey);
    logger.debug(`[pi-agent] Using Pi OAuth key for provider '${oauthProvider}'`);
  }

  const { openai } = config.attendanceExtraction.apiKeys;
  if (openai) authStorage.setRuntimeApiKey('openai', openai);

  const modelRegistry = sdk.ModelRegistry.create(authStorage);
  const model = await resolveModel(modelRegistry);
  const { session } = await sdk.createAgentSession({
    sessionManager: sdk.SessionManager.inMemory(process.cwd()),
    authStorage,
    modelRegistry,
    model,
    allowedToolNames: [],
  });

  return { session, model };
};

const promptPiSession = async (session: any, prompt: string, imagePath: string, mimeType: string): Promise<string> => {

  await session.prompt(prompt, {
    images: [await createImagePayload(imagePath, mimeType)],
  });

  const responseText = session.getLastAssistantText();

  if (!responseText) {
    throw new ApiError(504, 'Vision LLM returned an empty response');
  }

  return responseText;
};

export const extractAttendanceWithPi = async (input: PiExtractionInput): Promise<PiExtractionResult> => {
  const { session, model } = await createPiSession();

  try {
    const responseText = await promptPiSession(session, createPrompt(input), input.imagePath, input.mimeType);

    return {
      rawResponse: responseText,
      provider: model.provider,
      model: model.id,
      promptVersion: ATTENDANCE_EXTRACTION_PROMPT_VERSION,
    };
  } finally {
    session.dispose();
  }
};

export const repairAttendanceJsonWithPi = async (rawResponse: string, input: PiExtractionInput): Promise<string> => {
  logger.warn('Retrying attendant extraction with JSON repair prompt');

  const repairPrompt = `${ATTENDANCE_EXTRACTION_REPAIR_PROMPT}\n\nPrevious response:\n${rawResponse}\n\nOCR context:\n${JSON.stringify({
    document_ai_text: input.documentAiText,
    document_ai_layout_summary: input.documentAiLayoutSummary,
  })}`;

  const { session } = await createPiSession();

  try {
    return await promptPiSession(session, repairPrompt, input.imagePath, input.mimeType);
  } finally {
    session.dispose();
  }
};
