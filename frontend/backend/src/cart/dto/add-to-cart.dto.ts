import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'product-id' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}
