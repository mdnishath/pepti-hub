import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: '+1234567890' })
  phone: string;

  @ApiProperty({ example: '123 Main St' })
  addressLine1: string;

  @ApiProperty({ example: 'Apt 4B', required: false })
  addressLine2?: string;

  @ApiProperty({ example: 'New York' })
  city: string;

  @ApiProperty({ example: 'NY' })
  state: string;

  @ApiProperty({ example: '10001' })
  zipCode: string;

  @ApiProperty({ example: 'USA' })
  country: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: AddressDto })
  @IsObject()
  shippingAddress: AddressDto;

  @ApiProperty({ type: AddressDto, required: false })
  @IsOptional()
  @IsObject()
  billingAddress?: AddressDto;

  @ApiProperty({ example: 'Please deliver before 5 PM', required: false })
  @IsOptional()
  @IsString()
  customerNote?: string;

  @ApiProperty({ example: 'credit_card', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
