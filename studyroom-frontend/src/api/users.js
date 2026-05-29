import { request } from './client.js';

export async function getDashboard(token) {
  return request('/users/me/dashboard', {}, token);
}
