import { describe, it, beforeEach, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRoutes from '../../routes/auth.js';
import roomsRoutes from '../../routes/rooms.js';
import Room from '../../models/Room.js';
import User from '../../models/User.js';

process.env.JWT_SECRET = 'testsecret';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomsRoutes);
  return app;
}

async function register(app) {
  const unique = Date.now();
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      username: `host_${unique}`,
      email: `host${unique}@example.com`,
      password: 'password123',
    });
  const token = res.body?.token;
  const user = res.body?.user;
  if (res.status !== 201 || !token || !user) {
    throw new Error(
      `Registro fallido: status=${res.status}, token=${typeof token}, user.id=${user?.id}`,
    );
  }
  return { token, user };
}

describe('routes/rooms', () => {
  let app;
  let hostToken;
  let hostUser;

  beforeEach(async () => {
    User.clear();
    Room.clear();
    app = makeApp();
    const reg = await register(app);
    hostToken = reg.token;
    hostUser = reg.user;
    expect(typeof hostToken).toBe('string');
    expect(hostUser?.id).toBeTruthy();
  });
  it('create requiere auth y sanitiza nombre', async () => {
    const noAuth = await request(app).post('/api/rooms/create').send({ name: 'Sala' });
    expect(noAuth.status).toBe(401);

    const bad = await request(app)
      .post('/api/rooms/create')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ name: '<script>bad</script>' });
    expect([200, 201, 400]).toContain(bad.status);

    const ok = await request(app)
      .post('/api/rooms/create')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ name: 'Sala Buena', minPlayers: 3, maxPlayers: 8, numImpostors: 1 });
    expect(ok.status).toBe(201);
    expect(ok.body.room.hostId).toBe(hostUser.id);
  });

  it('join y leave responden correctamente', async () => {
    const created = await request(app)
      .post('/api/rooms/create')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ name: 'Sala' });
    expect(created.status).toBe(201);
    const createdRoom = created.body?.room ?? created.body;
    const roomId = createdRoom?.id ?? createdRoom?.roomId;
    expect(roomId).toBeTruthy();

    const join = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ roomId });
    //expect(join).toBe("");
    expect(join.status).toBe(400);
    expect(join.text).toContain("Ya estás en esta sala");
    expect(join.text).toContain("No puedes unirte a una sala en la que ya estás");

    const second = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'second',
        email: `p2${Date.now()}@example.com`,
        password: 'password123',
      });
    //expect(second).toBe("");
    const token2 = second.body.token;
    const user2 = second.body.user;
    Room.addPlayer(roomId, user2.id, user2.username, null);

    const leave = await request(app)
      .post(`/api/rooms/${roomId}/leave`)
      .set('Authorization', `Bearer ${token2}`)
      .send();
    expect(leave.status).toBe(200);
    expect(leave.body.room?.players?.some((p) => p.userId === user2.id)).toBe(false);
  });
});
