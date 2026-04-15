import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocketIO = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Create socket connection
    const newSocket = io(url, {
      autoConnect: true,
      path: '/ws',
      transports: ['websocket'], //     bỏ qua polling, dùng thẳng websocket
      ...options
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      setConnected(false);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [url]);

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return {
    socket,
    connected,
    error,
    emit,
    on,
    off
  };
};

export default useSocketIO;