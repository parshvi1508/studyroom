import { request } from './client.js';

export async function createRoom(name, token) {
  return request('/rooms/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }, token);
}

export async function listRooms(token) {
  return request('/rooms/', {}, token);
}

export async function getRoom(code, token) {
  return request(`/rooms/${code}`, {}, token);
}

export async function archiveRoom(code, token) {
  return request(`/rooms/${code}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: false }),
  }, token);
}

export async function deleteRoom(code, token) {
  return request(`/rooms/${code}`, {
    method: 'DELETE',
  }, token);
}

export async function getRoomMessages(code, token) {
  return request(`/rooms/${code}/messages`, {}, token);
}

export async function getRoomActivity(code, token) {
  return request(`/rooms/${code}/activity`, {}, token);
}

export async function getActiveSession(code, token) {
  return request(`/rooms/${code}/session/active`, {}, token);
}
