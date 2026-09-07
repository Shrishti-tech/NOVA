const request = require('supertest');
const app = require('../app');

describe('Auth', () => {
  const user = { name: 'Alice', email: 'alice@example.com', password: 'password123' };

  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe(user.email);
    expect(res.body).not.toHaveProperty('password');
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(400);
  });

  it('rejects registration missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@example.com' });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    const reg = await request(app).post('/api/auth/register').send(user);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
  });
});
