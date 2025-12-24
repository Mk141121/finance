import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserTenant } from '../tenants/entities/user-tenant.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let userTenantRepository: Repository<UserTenant>;
  let jwtService: JwtService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
    fullName: 'Test User',
    isActive: true,
    role: { id: '1', name: 'admin' },
  };

  const mockUserTenant = {
    id: '1',
    userId: '1',
    tenantId: 'tenant-1',
    isDefault: true,
    tenant: { id: 'tenant-1', name: 'Test Tenant', taxCode: '0100000000' },
    role: { id: '1', name: 'admin' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserTenant),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userTenantRepository = module.get<Repository<UserTenant>>(
      getRepositoryToken(UserTenant),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest
        .spyOn(userTenantRepository, 'findOne')
        .mockResolvedValue(mockUserTenant as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(inactiveUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        fullName: 'New User',
        password: 'password123',
        companyName: 'Test Company',
        taxCode: '0100000001',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as any);
      jest
        .spyOn(userTenantRepository, 'findOne')
        .mockResolvedValue(mockUserTenant as any);

      const result = await service.register(newUser);

      expect(result).toHaveProperty('email');
      expect(result.email).toBe('test@example.com');
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });
  });
});
