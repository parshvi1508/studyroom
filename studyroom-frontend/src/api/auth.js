import { request } from './client.js';

export async function register(email, password, display_name) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name }),
  });
}

export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token) {
  return request('/auth/me', {}, token);
}
