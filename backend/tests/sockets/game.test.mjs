import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import { server as httpServer, io as serverIo } from '../../server';
import { generateToken } from '../../utils/jwt';
import User from '../../models/User';
import Room from '../../models/Room';
import Game from '../../models/Game';

describe('Game Socket Tests', () => {
  let server, io, clients = [], users = [];
  const PORT = 3001;

  beforeAll(() => new Promise((resolve) => {
    server = httpServer.listen(PORT, async () => {
      io = serverIo;
      // Crear usuarios
      for (let i = 0; i < 4; i++) {
        const user = await User.create(`testuser${i}`, `test${i}@test.com`, 'password');
        const token = generateToken(user.id, user.username);
        users.push({ ...user, token });
      }
      resolve();
    });
  }));

  afterAll(() => {
    io.close();
    server.close();
    clients.forEach(c => c.disconnect());
  });

  it('debería manejar un empate en la votación y resolverlo', () => new Promise(async (resolve) => {
    // Conectar clientes
    for (const user of users) {
      const client = Client(`http://localhost:${PORT}`, {
        auth: { token: user.token },
      });
      clients.push(client);
    }

    await Promise.all(clients.map(c => new Promise(res => c.on('connect', res))));

    const hostClient = clients[0];
    const otherClients = clients.slice(1);
    const hostUser = users[0];
    
    // Crear y unirse a la sala
    const roomResponse = await (await fetch(`http://localhost:${PORT}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hostUser.token}` },
        body: JSON.stringify({ name: 'Tie Test Room' })
    })).json();
    const roomId = roomResponse.room.id;
    
    hostClient.emit('room:join', { roomId });
    for (const client of otherClients) {
        client.emit('room:join', { roomId });
    }

    // Esperar a que todos se unan
    await new Promise(res => setTimeout(res, 500));

    // Iniciar juego
    hostClient.emit('game:start', { roomId });
    await new Promise(res => hostClient.on('game:phaseChanged', d => d.phase === 'roles' && res()));
    
    // Iniciar fase de pistas
    hostClient.emit('game:startCluesPhase', { roomId });
    await new Promise(res => hostClient.on('game:phaseChanged', d => d.phase === 'clues' && res()));

    // Dar pistas para llegar a la votación
    const game = Game.getGameStateInternal(roomId);
    const activePlayers = game.players.filter(p => !p.isEliminated);
    for (const player of activePlayers) {
      const client = clients.find(c => c.io.opts.auth.token === users.find(u => u.id === player.userId).token);
      client.emit('game:submitClue', { roomId, clue: `clue from ${player.username}` });
      await new Promise(res => setTimeout(res, 50));
    }

    await new Promise(res => hostClient.on('game:phaseChanged', d => d.phase === 'voting' && res()));

    // Votar para crear un empate (0 vs 1, y 2 vs 3)
    clients[0].emit('game:submitVote', { roomId, votedPlayerId: users[1].id });
    clients[1].emit('game:submitVote', { roomId, votedPlayerId: users[0].id });
    clients[2].emit('game:submitVote', { roomId, votedPlayerId: users[0].id });
    clients[3].emit('game:submitVote', { roomId, votedPlayerId: users[1].id });
    
    // Escuchar el evento de empate
    hostClient.on('game:tie', (data) => {
      expect(data.tiedPlayers).toHaveLength(2);
      expect(data.tiedPlayers.map(p => p.userId).sort()).toEqual([users[0].id, users[1].id].sort());

      // El host resuelve el empate
      setTimeout(() => {
        hostClient.emit('game:resolveTie', { roomId });
      }, 100);
    });

    // Escuchar el resultado final
    hostClient.on('game:votingResults', (data) => {
      if (!data.isTieResolution) return; 

      expect(data.isTieResolution).toBe(true);
      expect(data.results.eliminatedPlayer).not.toBeNull();
      const eliminatedId = data.results.eliminatedPlayer.userId;
      expect([users[0].id, users[1].id]).toContain(eliminatedId);

      const finalGameState = Game.getGameStateInternal(roomId);
      expect(finalGameState.phase).toBe('results');
      resolve();
    });
  }));
});
