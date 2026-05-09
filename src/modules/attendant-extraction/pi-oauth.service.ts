import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import config from '../../config/config';
import { logger } from '../logger';
import type { OAuthCredentials as PiOAuthCredentials } from '@earendil-works/pi-ai';

const CACHE_PATH = join(process.cwd(), '.pi-oauth-cache.json');
const OPENAI_CODEX_PROVIDER_ID = 'openai-codex';
const OPENAI_CODEX_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const OPENAI_CODEX_TOKEN_URL = 'https://auth.openai.com/oauth/token';

type TokenSuccess = { type: 'success'; access: string; refresh: string; expires: number };
type TokenFailure = { type: 'failed'; message: string; status?: number };
type TokenResult = TokenSuccess | TokenFailure;

type OAuthCredentials = PiOAuthCredentials & {
  type: 'oauth';
  access: string;
  refresh: string;
  expires: number;
  [key: string]: unknown;
};

type RawOAuthCredentials = {
  type?: 'oauth';
  access?: string;
  refresh?: string;
  expires?: number;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

type AuthStore = Record<string, OAuthCredentials>;

const readCache = (): AuthStore => {
  try {
    if (existsSync(CACHE_PATH)) {
      const parsed = JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as Record<string, RawOAuthCredentials>;
      return Object.fromEntries(
        Object.entries(parsed)
          .map(([provider, credentials]) => [provider, normalizeCredentials(credentials)])
          .filter((entry): entry is [string, OAuthCredentials] => entry[1] !== null),
      );
    }
  } catch {
  }
  return {};
};

const normalizeCredentials = (credentials: RawOAuthCredentials | undefined): OAuthCredentials | null => {
  const access = credentials?.access ?? credentials?.accessToken;
  const refresh = credentials?.refresh ?? credentials?.refreshToken;
  const expires = credentials?.expires ?? credentials?.expiresAt;

  if (!access || !refresh || typeof expires !== 'number') {
    return null;
  }

  return {
    type: 'oauth',
    access,
    refresh,
    expires,
  };
};

const writeCache = (store: AuthStore): void => {
  try {
    writeFileSync(CACHE_PATH, JSON.stringify(store, null, 2), { mode: 0o600 });
  } catch (err: any) {
    logger.warn(`[pi-oauth] Could not write token cache: ${err?.message ?? err}`);
  }
};

const buildAuthStore = (): AuthStore | null => {
  const provider = getRuntimePiOAuthProviderId();
  const { accessToken, refreshToken, expiresAt } = config.piOAuth;

  if (!provider) return null;

  const fromEnv = normalizeCredentials({
    type: 'oauth',
    ...(accessToken ? { access: accessToken } : {}),
    ...(refreshToken ? { refresh: refreshToken } : {}),
    ...(typeof expiresAt === 'number' ? { expires: expiresAt } : {}),
  });

  if (!fromEnv) {
    logger.warn('[pi-oauth] PI_OAUTH_ACCESS_TOKEN, PI_OAUTH_REFRESH_TOKEN, and PI_OAUTH_EXPIRES_AT must all be set');
    return null;
  }

  const cache = readCache();
  const cached = normalizeCredentials(cache[provider]);
  const merged: OAuthCredentials = cached ? { ...fromEnv, ...cached } : fromEnv;

  return { [provider]: merged };
};

export const getRuntimePiOAuthProviderId = (): string | null => {
  const provider = config.piOAuth.provider?.trim();
  console.log("[pi-oauth] Provider:", provider);
  if (!provider) return null;
  if (provider === 'open-codex') return OPENAI_CODEX_PROVIDER_ID;
  return provider;
};

const refreshAccessToken = async (refreshToken: string): Promise<TokenResult> => {
  try {
    const response = await fetch(OPENAI_CODEX_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: OPENAI_CODEX_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return {
        type: 'failed',
        status: response.status,
        message: `OpenAI Codex token refresh failed (${response.status}): ${text || response.statusText}`,
      };
    }

    const json = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    if (!json.access_token || !json.refresh_token || typeof json.expires_in !== 'number') {
      return {
        type: 'failed',
        message: `OpenAI Codex token refresh response missing fields: ${JSON.stringify(json)}`,
      };
    }

    return {
      type: 'success',
      access: json.access_token,
      refresh: json.refresh_token,
      expires: Date.now() + json.expires_in * 1000,
    };
  } catch (error) {
    return {
      type: 'failed',
      message: `OpenAI Codex token refresh error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export const getPiOAuthApiKey = async (): Promise<string | null> => {
  const provider = getRuntimePiOAuthProviderId();
  if (!provider) return null;

  const authStore = buildAuthStore();
  if (!authStore) return null;

  try {
    const updatedCache = readCache();
    const current = authStore[provider];

    if (provider !== OPENAI_CODEX_PROVIDER_ID) {
      logger.warn(`[pi-oauth] Unsupported OAuth provider '${provider}'`);
      return null;
    }

    if (!current) {
      logger.warn(`[pi-oauth] No OAuth credentials available for '${provider}'`);
      return null;
    }

    if (current.expires > Date.now() + 60_000) {
      updatedCache[provider] = current;
      writeCache(updatedCache);
      return current.access;
    }

    const refreshed = await refreshAccessToken(current.refresh);

    if (refreshed.type === 'failed') {
      logger.warn(`[pi-oauth] Failed to refresh OAuth key for '${provider}': ${refreshed.message}`);
      return null;
    }

    updatedCache[provider] = {
      type: 'oauth',
      access: refreshed.access,
      refresh: refreshed.refresh,
      expires: refreshed.expires,
    };
    writeCache(updatedCache);

    logger.debug(`[pi-oauth] API key obtained for provider '${provider}'`);
    return refreshed.access;
  } catch (err: any) {
    logger.warn(`[pi-oauth] Failed to get API key for '${provider}': ${err?.message ?? String(err)}`);
    return null;
  }
};
