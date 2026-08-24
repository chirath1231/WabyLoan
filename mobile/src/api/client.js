import { translate } from '../i18n/translations';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(status, message, issues) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

let authToken = null;
let currentLanguage = 'en';

/** Called once by AuthContext whenever the signed-in state changes, so every request picks it up. */
export function setAuthToken(token) {
  authToken = token;
}

/** Called once by LanguageProvider whenever the selected language changes, so error messages picks it up. */
export function setApiLanguage(lang) {
  currentLanguage = lang;
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, translate(currentLanguage, 'common.networkError'));
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(res.status, (data && data.error) || res.statusText, data && data.issues);
  }
  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
};
