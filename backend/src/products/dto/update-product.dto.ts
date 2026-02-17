import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'The latest iPhone with advanced features',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Powerful smartphone', required: false })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ example: 999.99, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 1099.99, required: false })
  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;

  @ApiProperty({ example: 700, required: false })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 'IP15PRO-001', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  lowStockThreshold?: number;

  @ApiProperty({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    example: 'https://example.com/thumbnail.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ example: 'category-id', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ example: 'iPhone 15 Pro - Best Smartphone', required: false })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({ example: 'Buy the latest iPhone 15 Pro...', required: false })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({ example: 'Acetyl Hexapeptide-8', required: false })
  @IsOptional()
  @IsString()
  chemicalName?: string;

  @ApiProperty({ example: '616204-22-9', required: false })
  @IsOptional()
  @IsString()
  casNumber?: string;

  @ApiProperty({ example: '≥95%', required: false })
  @IsOptional()
  @IsString()
  purity?: string;

  @ApiProperty({ example: 'C34H60N14O12S', required: false })
  @IsOptional()
  @IsString()
  molecularFormula?: string;

  @ApiProperty({ example: 'Ac-Glu-Glu-Met-Gln-Arg-Arg-NH2', required: false })
  @IsOptional()
  @IsString()
  sequence?: string;

  @ApiProperty({ example: 'Lyophilized Powder', required: false })
  @IsOptional()
  @IsString()
  productForm?: string;

  @ApiProperty({ example: 'This product is for research use only...', required: false })
  @IsOptional()
  @IsString()
  researchNotice?: string;
}
