import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://harmony-backend-t72j.onrender.com');

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export const joinGuild = (guildId) => {
  socket.emit('join-guild', guildId);
};

export const leaveGuild = (guildId) => {
  socket.emit('leave-guild', guildId);
};

export default socket;
