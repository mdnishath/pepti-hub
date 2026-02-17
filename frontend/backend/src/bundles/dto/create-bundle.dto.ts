import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class BundleProductDto {
  @ApiProperty({ example: 'product-id-123' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateBundleDto {
  @ApiProperty({ example: 'Starter Peptide Pack' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'starter-peptide-pack' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Complete starter pack with 3 essential peptides', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/bundle-image.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 15, description: 'Discount percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number;

  @ApiProperty({
    type: [BundleProductDto],
    example: [
      { productId: 'product-1', quantity: 2 },
      { productId: 'product-2', quantity: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleProductDto)
  products: BundleProductDto[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
