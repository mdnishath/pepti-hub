import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export class CreateMediaDto {
  @ApiProperty({ enum: MediaType, required: false })
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;
}
