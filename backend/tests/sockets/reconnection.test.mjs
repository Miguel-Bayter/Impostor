import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { io as Client } from 'socket.io-client';
import { server as httpServer, io as serverIo } from '../../server';
import { generateToken } from '../../utils/jwt';
import User from '../../models/User';
import Room from '../../models/Room';

describe('Socket Reconnection Tests', () => {
  let server, io, hostClient, playerClient, hostUser, playerUser, roomId;
  const PORT = 3002;

  beforeAll(() => new Promise(async (resolve) => {
    server = httpServer.listen(PORT, async () => {
      io = serverIo;
      // Crear usuarios
      hostUser = await User.create('hostuser', 'host@test.com', 'password');
      playerUser = await User.create('playeruser', 'player@test.com', 'password');
      hostUser.token = generateToken(hostUser.id, hostUser.username);
      playerUser.token = generateToken(playerUser.id, playerUser.username);
      
      // Conectar host
      hostClient = Client(`http://localhost:${PORT}`, { auth: { token: hostUser.token } });
      hostClient.on('connect', async () => {
        // Crear sala
        const roomResponse = await (await fetch(`http://localhost:${PORT}/api/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hostUser.token}` },
            body: JSON.stringify({ name: 'Reconnection Test Room' })
        })).json();
        roomId = roomResponse.room.id;
        hostClient.emit('room:join', { roomId });
        resolve();
      });
    });
  }));

  afterAll(() => {
    io.close();
    server.close();
    hostClient.disconnect();
    if(playerClient) playerClient.disconnect();
  });

  it('debería reconectar a un jugador a una sala automáticamente', () => new Promise(async (resolve) => {
    // 1. Conectar y unir al jugador 2
    playerClient = Client(`http://localhost:${PORT}`, { auth: { token: playerUser.token } });
    
    playerClient.on('connect', () => {
        playerClient.emit('room:join', { roomId });
    });

    await new Promise(res => playerClient.on('room:joined', res));

    // 2. Escuchar el evento de reconexión en el host
    const hostReconnectSpy = vi.fn();
    hostClient.on('room:playerReconnected', hostReconnectSpy);

    // 3. Desconectar al jugador 2
    playerClient.disconnect();

    // 4. Esperar un poco y reconectar
    await new Promise(res => setTimeout(res, 500));
    
    playerClient.connect();

    // 5. El jugador 2 debería recibir 'room:reconnected'
    playerClient.on('room:reconnected', (data) => {
      expect(data.room.id).toBe(roomId);
      expect(data.room.players.find(p => p.userId === playerUser.id)).toBeDefined();
      
      // El host debería haber sido notificado
      expect(hostReconnectSpy).toHaveBeenCalledOnce();
      const eventData = hostReconnectSpy.mock.calls[0][0];
      expect(eventData.player.userId).toBe(playerUser.id);
      resolve();
    });
  }));
});
