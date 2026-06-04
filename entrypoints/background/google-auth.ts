// Google OAuth utilities using chrome.identity

export async function getAuthToken(interactive: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!token) {
        reject(new Error('No token returned'));
      } else {
        resolve(token);
      }
    });
  });
}

export async function removeAuthToken(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

export async function checkAuthStatus(): Promise<boolean> {
  try {
    await getAuthToken(false);
    return true;
  } catch {
    return false;
  }
}

export async function authorizeUser(): Promise<boolean> {
  try {
    await getAuthToken(true);
    return true;
  } catch {
    return false;
  }
}
