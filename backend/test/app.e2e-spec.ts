import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET) - health check', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });

  describe('Auth endpoints', () => {
    it('/auth/login (POST) - should login successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'Admin@123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('accessToken');
        });
    });

    it('/auth/login (POST) - should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Protected endpoints', () => {
    let accessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'Admin@123',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('/auth/me (GET) - should get current user', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('email');
        });
    });

    it('/customers (GET) - should get customers list', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/products (GET) - should get products list', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Unauthorized access', () => {
    it('/auth/me (GET) - should fail without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('/customers (GET) - should fail without token', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .expect(401);
    });
  });
});
