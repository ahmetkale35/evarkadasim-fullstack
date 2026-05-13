import * as signalR from '@microsoft/signalr';
import { HUB_BASE_URL } from './config';
import { storage } from './storage';

let connection: signalR.HubConnection | null = null;

function getConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_BASE_URL}/hubs/chat`, {
        transport: signalR.HttpTransportType.WebSockets,
        accessTokenFactory: () => storage.getToken().then(t => t ?? ''),
      })
      .withAutomaticReconnect()
      .build();
  }
  return connection;
}

export const signalrService = {
  start: async () => {
    const conn = getConnection();
    if (conn.state === signalR.HubConnectionState.Disconnected) {
      await conn.start();
    }
  },

  stop: async () => {
    if (connection?.state === signalR.HubConnectionState.Connected) {
      await connection.stop();
    }
  },

  on: <T>(event: string, callback: (data: T) => void) => {
    getConnection().on(event, callback);
  },

  off: (event: string) => {
    getConnection().off(event);
  },
};
