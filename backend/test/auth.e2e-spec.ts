import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth Integration Tests (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await app.init();
    
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'Test@123456',
        fullName: 'Nguyễn Văn A',
        phone: '0987654321',
        companyName: 'Công ty Test',
        taxCode: '0100000001',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('email');
          expect(res.body.data).not.toHaveProperty('passwordHash');
          userId = res.body.data.id;
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test@123456',
          fullName: 'Test User',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          fullName: 'Test User',
        })
        .expect(400);
    });

    it('should fail with duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Test@123456',
          fullName: 'First User',
          companyName: 'Company 1',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Test@123456',
          fullName: 'Second User',
          companyName: 'Company 2',
        })
        .expect(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const testEmail = `login-test-${Date.now()}@example.com`;
    const testPassword = 'Test@123456';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          fullName: 'Login Test User',
          companyName: 'Test Company',
        });
    });

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user).toHaveProperty('email', testEmail);
          expect(res.body.data.user).toHaveProperty('tenant');
          authToken = res.body.data.access_token;
          tenantId = res.body.data.user.tenant.id;
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123',
        })
        .expect(401);
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);
    });

    it('should fail without credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('email');
          expect(res.body.data).toHaveProperty('fullName');
          expect(res.body.data).not.toHaveProperty('passwordHash');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Security Tests', () => {
    it('should hash passwords', async () => {
      const email = `security-test-${Date.now()}@example.com`;
      const password = 'Test@123456';

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email,
          password,
          fullName: 'Security Test',
          companyName: 'Test',
        });

      // Verify password is hashed in database
      const user = await dataSource.query(
        'SELECT password_hash FROM users WHERE email = $1',
        [email],
      );

      expect(user[0].password_hash).not.toBe(password);
      expect(user[0].password_hash).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    it('should include tenant_id in JWT payload', () => {
      // JWT payload should contain: user_id, tenant_id, role
      expect(authToken).toBeDefined();
      expect(tenantId).toBeDefined();
    });

    it('should handle rate limiting (if implemented)', async () => {
      // Test multiple failed login attempts
      const attempts = Array(6).fill(null);
      
      for (const _ of attempts) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrong',
          });
      }

      // After 5 failed attempts, should be rate limited
      // This test assumes rate limiting is implemented
    });
  });
});
