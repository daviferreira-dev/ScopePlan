import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './api';

// Derive the Socket.IO server URL from the API base.
// In dev, Vite proxies /socket.io → localhost:5000.
// In prod, VITE_API_URL is e.g. "https://api.example.com/api", so we strip "/api".
const SOCKET_URL: string =
  import.meta.env.VITE_API_URL
    ? (import.meta.env.VITE_API_URL as string).replace(/\/api\/?$/, '')
    : '';  // empty string = same origin (proxied by Vite in dev)

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket || !_socket.connected) {
    _socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: () => ({ token: getAccessToken() }),
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
