import socket from 'socket.io-client';

let socketInstance = null;

export const initializeSocket = (projectId) => {
    socketInstance = socket(import.meta.env.VITE_BACKEND_URL,{
        auth: {
            token:localStorage.getItem("token")
        },
        query:{
            projectId
        }
    })

    return socketInstance;
}

export const receiveMsg = (eventName,callback) => {
    if(!socketInstance) return;

    socketInstance.on(eventName,callback);
}

export const sendMsg = (eventName,data) => {
    if(!socketInstance) return;

    socketInstance.emit(eventName,data);
}

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
