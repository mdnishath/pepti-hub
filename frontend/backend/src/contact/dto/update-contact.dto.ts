import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContactDto {
  @ApiProperty({ example: true, description: 'Mark contact as read' })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
