const fs = require('fs');
const path = require('path');

// Update CreateProductDto
const createDtoPath = path.join(__dirname, 'src', 'products', 'dto', 'create-product.dto.ts');
let createContent = fs.readFileSync(createDtoPath, 'utf8');

// Add productForm and researchNotice fields before the closing brace
const createInsertPoint = `  @ApiProperty({ example: 'Ac-Glu-Glu-Met-Gln-Arg-Arg-NH2', required: false })
  @IsOptional()
  @IsString()
  sequence?: string;
}`;

const createNewContent = `  @ApiProperty({ example: 'Ac-Glu-Glu-Met-Gln-Arg-Arg-NH2', required: false })
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
}`;

createContent = createContent.replace(createInsertPoint, createNewContent);
fs.writeFileSync(createDtoPath, createContent, 'utf8');
console.log('✅ Updated CreateProductDto');

// Update UpdateProductDto
const updateDtoPath = path.join(__dirname, 'src', 'products', 'dto', 'update-product.dto.ts');
let updateContent = fs.readFileSync(updateDtoPath, 'utf8');

// Add productForm and researchNotice fields before the closing brace
const updateInsertPoint = `  @ApiProperty({ example: 'Ac-Glu-Glu-Met-Gln-Arg-Arg-NH2', required: false })
  @IsOptional()
  @IsString()
  sequence?: string;
}`;

const updateNewContent = `  @ApiProperty({ example: 'Ac-Glu-Glu-Met-Gln-Arg-Arg-NH2', required: false })
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
}`;

updateContent = updateContent.replace(updateInsertPoint, updateNewContent);
fs.writeFileSync(updateDtoPath, updateContent, 'utf8');
console.log('✅ Updated UpdateProductDto');

console.log('\n✨ All DTOs updated successfully!');
