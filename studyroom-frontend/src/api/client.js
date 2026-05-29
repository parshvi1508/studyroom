const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function request(path, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new ApiError(0, 'Network error - could not reach server', null);
  }

  if (!response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch {
      // not JSON
    }
    const message = body?.detail || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
