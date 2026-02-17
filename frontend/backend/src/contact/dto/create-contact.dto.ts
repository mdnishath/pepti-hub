import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Name must be a valid text' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'I have a question about your products...' })
  @IsString({ message: 'Message must be valid text' })
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(10, { message: 'Message must be at least 10 characters long' })
  @MaxLength(5000, { message: 'Message must not exceed 5000 characters' })
  message: string;
}
