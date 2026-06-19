// Google OAuth utilities using chrome.identity.launchWebAuthFlow
//
// launchWebAuthFlow is used instead of chrome.identity.getAuthToken because
// getAuthToken is pinned to the Chrome profile account - it can never show
// Google's account chooser, so switching accounts is impossible with it.
// With launchWebAuthFlow we control the auth URL directly and can pass
// prompt=select_account to land the user on the "Choose an account" page.

import { STORAGE_KEYS } from '../../lib/storage/keys';

// Thrown when the user needs to (re)connect their Google account
export class AuthRequiredError extends Error {
  code = 'AUTH_REQUIRED';

  constructor(message: string = 'Google account not connected. Please connect your Google account to continue.') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// Refresh tokens this close to expiry instead of using them
const EXPIRY_MARGIN_MS = 60 * 1000;

interface StoredToken {
  token: string;
  expiresAt: number;
}

async function getStoredToken(): Promise<StoredToken | null> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.GOOGLE_ACCESS_TOKEN,
    STORAGE_KEYS.GOOGLE_TOKEN_EXPIRES_AT
  ]);
  const token = result[STORAGE_KEYS.GOOGLE_ACCESS_TOKEN];
  const expiresAt = result[STORAGE_KEYS.GOOGLE_TOKEN_EXPIRES_AT];
  if (!token || !expiresAt) {
    return null;
  }
  return { token, expiresAt };
}

async function storeToken(token: string, expiresInSeconds: number): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.GOOGLE_ACCESS_TOKEN]: token,
    [STORAGE_KEYS.GOOGLE_TOKEN_EXPIRES_AT]: Date.now() + expiresInSeconds * 1000
  });
}

async function clearStoredToken(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEYS.GOOGLE_ACCESS_TOKEN,
    STORAGE_KEYS.GOOGLE_TOKEN_EXPIRES_AT
  ]);
}

function buildAuthUrl(options: { prompt?: string; loginHint?: string }): string {
  const manifest = chrome.runtime.getManifest() as any;
  const params = new URLSearchParams({
    client_id: manifest.oauth2.client_id,
    response_type: 'token',
    redirect_uri: chrome.identity.getRedirectURL(),
    scope: manifest.oauth2.scopes.join(' ')
  });
  if (options.prompt) {
    params.set('prompt', options.prompt);
  }
  if (options.loginHint) {
    params.set('login_hint', options.loginHint);
  }
  return `${AUTH_URL}?${params.toString()}`;
}

async function launchAuthFlow(interactive: boolean, prompt?: string): Promise<string> {
  // Silent refreshes need a login_hint so Google knows which of the user's
  // sessions to mint the token for without showing UI. Interactive account
  // selection must NOT send a hint or the chooser would be pre-filtered.
  let loginHint: string | undefined;
  if (!interactive) {
    const result = await chrome.storage.local.get(STORAGE_KEYS.GOOGLE_LOGIN_HINT);
    loginHint = result[STORAGE_KEYS.GOOGLE_LOGIN_HINT];
  }

  const url = buildAuthUrl({
    prompt: interactive ? prompt : 'none',
    loginHint
  });

  const redirectUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({ url, interactive }, (responseUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!responseUrl) {
        reject(new Error('No response from auth flow'));
      } else {
        resolve(responseUrl);
      }
    });
  });

  // Token comes back in the URL fragment: #access_token=...&expires_in=...
  const fragment = new URLSearchParams(new URL(redirectUrl).hash.slice(1));
  const error = fragment.get('error');
  if (error) {
    throw new Error(`Authorization failed: ${error}`);
  }

  const token = fragment.get('access_token');
  if (!token) {
    throw new Error('No token returned');
  }

  const expiresIn = parseInt(fragment.get('expires_in') || '3600', 10);
  await storeToken(token, expiresIn);

  // Remember which account was used so silent refreshes target it
  void updateLoginHint(token);

  return token;
}

async function updateLoginHint(token: string): Promise<void> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.email) {
        await chrome.storage.local.set({ [STORAGE_KEYS.GOOGLE_LOGIN_HINT]: data.email });
      }
    }
  } catch {
    // Non-fatal - silent refresh will just be less reliable
  }
}

export async function getAuthToken(interactive: boolean = false): Promise<string> {
  const stored = await getStoredToken();
  if (stored && stored.expiresAt > Date.now() + EXPIRY_MARGIN_MS) {
    return stored.token;
  }

  // Try to refresh silently using the existing grant
  try {
    return await launchAuthFlow(false);
  } catch {
    if (!interactive) {
      throw new AuthRequiredError();
    }
  }

  return launchAuthFlow(true, 'select_account');
}

export async function removeAuthToken(_token?: string): Promise<void> {
  await clearStoredToken();
}

export async function checkAuthStatus(): Promise<boolean> {
  try {
    const token = await getAuthToken(false);
    // Validate against Google - a stored token may have been revoked
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
    );
    if (!response.ok) {
      await clearStoredToken();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function authorizeUser(): Promise<boolean> {
  try {
    // Always show Google's account chooser, even when a token is cached,
    // so this doubles as the "switch account" flow. The existing grant is
    // NOT revoked first - already-approved accounts go straight through
    // without hitting the consent (unverified app) screen again.
    await launchAuthFlow(true, 'select_account');
    return true;
  } catch {
    return false;
  }
}

export async function getUserInfo(): Promise<{ email: string; name: string } | null> {
  try {
    const token = await getAuthToken(false);
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Token was revoked or expired - clear it so the next auth attempt
      // mints a fresh one instead of reusing the stale token
      if (response.status === 401) {
        await clearStoredToken();
      }
      return null;
    }

    const data = await response.json();
    return {
      email: data.email,
      name: data.name
    };
  } catch {
    return null;
  }
}

export async function revokeAuth(): Promise<void> {
  try {
    const stored = await getStoredToken();
    await clearStoredToken();
    await chrome.storage.local.remove(STORAGE_KEYS.GOOGLE_LOGIN_HINT);
    if (stored) {
      // Also revoke the token on Google's side
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${stored.token}`);
    }
  } catch (error) {
    // Ignore errors - token may already be invalid
    console.error('Error revoking auth:', error);
  }
}
