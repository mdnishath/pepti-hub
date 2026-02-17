import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { Plan } from '@prisma/client';

export class UpdateTenantDto {
  @ApiProperty({ example: 'Acme Corp', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'acme.com', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'contact@acme.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: '#3b82f6', required: false })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({ example: 'USD', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiProperty({ enum: Plan, required: false })
  @IsOptional()
  @IsEnum(Plan)
  plan?: Plan;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'noreply@example.com', required: false })
  @IsOptional()
  @IsString()
  emailFrom?: string;

  @ApiProperty({ example: 'contact@example.com', required: false, description: 'Email to receive contact form notifications' })
  @IsOptional()
  @IsEmail()
  contactNotificationEmail?: string;

  @ApiProperty({ example: 'orders@example.com', required: false, description: 'Email to receive order notifications' })
  @IsOptional()
  @IsEmail()
  orderNotificationEmail?: string;

  @ApiProperty({
    example: { host: 'smtp.gmail.com', port: 587, user: 'user@gmail.com', password: 'password' },
    required: false,
    description: 'SMTP configuration object with host, port, user, and password'
  })
  @IsOptional()
  smtpConfig?: any;

  @ApiProperty({ example: 'sk_test_...', required: false })
  @IsOptional()
  @IsString()
  stripeKey?: string;

  @ApiProperty({ example: 'sslcz...', required: false })
  @IsOptional()
  @IsString()
  sslcommerzKey?: string;
}
