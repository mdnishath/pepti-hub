import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto, tenantId: string) {
    console.log('🔍 Registration attempt:', {
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      tenantId,
    });

    // Check if user already exists in this tenant
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email_tenantId: {
          email: registerDto.email,
          tenantId,
        },
      },
    });

    if (existingUser) {
      console.log('❌ Registration failed: User already exists', registerDto.email);
      throw new ConflictException('User with this email already exists');
    }

    console.log('✅ Email available, proceeding with registration...');

    // Hash password
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    console.log('✅ Password hashed successfully');

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });

    console.log('✅ User created successfully in database:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);

    console.log('✅ JWT tokens generated for user:', user.email);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, tenantId: string) {
    console.log('🔍 Login attempt:', {
      email: loginDto.email,
      tenantId,
    });

    // Find user by email and tenantId
    const user = await this.prisma.user.findUnique({
      where: {
        email_tenantId: {
          email: loginDto.email,
          tenantId,
        },
      },
    });

    if (!user) {
      console.log('❌ Login failed: User not found', loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ User found:', { id: user.id, email: user.email, isActive: user.isActive });

    if (!user.isActive) {
      console.log('❌ Login failed: Account inactive', loginDto.email);
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password', loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ Password verified successfully');

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);

    console.log('✅ Login successful for user:', user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
      ...tokens,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: string, tenantId: string) {
    const payload = { sub: userId, email, role, tenantId };

    const accessExpiresIn = this.configService.get<string>('jwt.expiresIn') ?? '7d';
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') ?? '30d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret') ?? 'default-secret',
        expiresIn: accessExpiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret') ?? 'default-refresh-secret',
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
