import { describe, it, beforeEach, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRoutes from '../../routes/auth.js';
import User from '../../models/User.js';

process.env.JWT_SECRET = 'testsecret';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('routes/auth', () => {
  beforeEach(() => {
    User.clear();
  });

  it('register crea usuario y token', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'User<script>Test',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
      });
    expect(res.status).toBe(201);
    expect(res.body.user.username.includes('<')).toBe(false);
    expect(typeof res.body.token).toBe('string');
  });

  it('login y me funcionan', async () => {
    const app = makeApp();
    const email = `login${Date.now()}@example.com`;
    const reg = await request(app).post('/api/auth/register').send({
      username: 'user',
      email,
      password: 'password123',
    });
    const token = reg.body.token;

    const bad = await request(app).post('/api/auth/login').send({
      email,
      password: 'wrong',
    });
    expect(bad.status).toBe(401);

    const ok = await request(app).post('/api/auth/login').send({
      email,
      password: 'password123',
    });
    expect(ok.status).toBe(200);
    expect(typeof ok.body.token).toBe('string');

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBeTruthy();
  });
});
