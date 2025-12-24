import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserTenant } from '../tenants/entities/user-tenant.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // Get user's default tenant
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId: user.id, isDefault: true },
      relations: ['tenant', 'role'],
    });

    // If no default, get first tenant
    const activeTenant = userTenant || await this.userTenantRepository.findOne({
      where: { userId: user.id },
      relations: ['tenant', 'role'],
    });

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: activeTenant?.role?.name || user.role?.name,
      tenantId: activeTenant?.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: activeTenant?.role || user.role
          ? {
              name: (activeTenant?.role || user.role).name,
              displayName: (activeTenant?.role || user.role).displayName,
            }
          : null,
        tenant: activeTenant?.tenant ? {
          id: activeTenant.tenant.id,
          companyName: activeTenant.tenant.companyName,
          taxCode: activeTenant.tenant.taxCode,
        } : null,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email đã được sử dụng');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
      roleId: registerDto.roleId,
    });

    await this.userRepository.save(user);

    // Return without password
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash: _, ...result } = user;
      return result;
    }

    return null;
  }
}
