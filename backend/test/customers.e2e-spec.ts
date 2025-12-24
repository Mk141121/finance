import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Customers API Integration Tests (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let tenantId: string;
  let customerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@demo.com',
        password: 'Admin@123',
      });

    authToken = loginResponse.body.data.access_token;
    tenantId = loginResponse.body.data.user.tenant.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/customers', () => {
    it('should create a new customer', () => {
      const createDto = {
        code: `KH-${Date.now()}`,
        name: 'Công ty TNHH Test',
        type: 'company',
        taxCode: '0100000001',
        address: '123 Test Street, Hà Nội',
        phone: '0987654321',
        email: 'test@company.com',
      };

      return request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.code).toBe(createDto.code);
          expect(res.body.data.name).toBe(createDto.name);
          customerId = res.body.data.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/customers')
        .send({
          code: 'KH999',
          name: 'Test Customer',
        })
        .expect(401);
    });

    it('should fail with duplicate customer code', async () => {
      const code = `DUP-${Date.now()}`;
      
      await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code,
          name: 'First Customer',
          type: 'individual',
        });

      return request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code,
          name: 'Second Customer',
          type: 'individual',
        })
        .expect(409);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'KH001',
          // missing name
        })
        .expect(400);
    });

    it('should validate tax code format for company', () => {
      return request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: `KH-${Date.now()}`,
          name: 'Company with Invalid Tax Code',
          type: 'company',
          taxCode: 'invalid',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/customers', () => {
    it('should return paginated list of customers', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('items');
          expect(res.body.data).toHaveProperty('meta');
          expect(Array.isArray(res.body.data.items)).toBe(true);
          expect(res.body.data.meta).toHaveProperty('total');
          expect(res.body.data.meta).toHaveProperty('page');
          expect(res.body.data.meta).toHaveProperty('limit');
        });
    });

    it('should filter by search term', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers?search=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should filter by type', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers?type=company')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should paginate results', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.meta.page).toBe(1);
          expect(res.body.data.meta.limit).toBe(10);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers')
        .expect(401);
    });
  });

  describe('GET /api/v1/customers/:id', () => {
    it('should return a customer by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id', customerId);
          expect(res.body.data).toHaveProperty('code');
          expect(res.body.data).toHaveProperty('name');
        });
    });

    it('should return 404 for non-existent customer', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/customers/:id', () => {
    it('should update a customer', () => {
      const updateDto = {
        name: 'Updated Company Name',
        address: 'New Address 456',
      };

      return request(app.getHttpServer())
        .put(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe(updateDto.name);
          expect(res.body.data.address).toBe(updateDto.address);
        });
    });

    it('should return 404 for non-existent customer', () => {
      return request(app.getHttpServer())
        .put('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/customers/:id', () => {
    it('should soft delete a customer', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should return 404 for non-existent customer', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Multi-tenancy Isolation', () => {
    it('should only return customers from own tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // All customers should belong to the same tenant
      const customers = response.body.data.items;
      if (customers.length > 0) {
        customers.forEach((customer: any) => {
          expect(customer.tenantId).toBe(tenantId);
        });
      }
    });
  });
});
