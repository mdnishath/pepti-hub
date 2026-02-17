import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class CreateQualityImageDto {
  @ApiProperty({ example: 'Certificate of Analysis - Batch #12345' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Third-party lab testing results showing 99.5% purity', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/coa/batch-12345.jpg' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ example: 1, required: false, description: 'Display order (lower numbers first)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
