import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import connectDB from '../src/config/db.js';
import app from '../server.js';
import User from '../src/models/User.js';

let mongoServer;
let adminToken;
let userToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri);

  // create an admin user directly in DB
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
  });

  // create a regular user too
  const normal = await User.create({
    name: 'Normal User',
    email: 'user@example.com',
    password: 'password123',
  });

  // login both to get access tokens
  const resA = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'password123' })
    .expect(200);
  adminToken = resA.body.token;

  const resU = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@example.com', password: 'password123' })
    .expect(200);
  userToken = resU.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Admin routes', () => {
  test('non-authenticated cannot access admin endpoint', async () => {
    await request(app).get('/api/admin/users').expect(401);
  });

  test('authenticated non-admin gets 403', async () => {
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  test('admin user can fetch list of users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    // ensure password field is not returned
    expect(res.body.users[0].password).toBeUndefined();
  });
});
