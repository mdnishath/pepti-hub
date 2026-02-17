import { PartialType } from '@nestjs/swagger';
import { CreateQualityImageDto } from './create-quality-image.dto';

export class UpdateQualityImageDto extends PartialType(CreateQualityImageDto) {}
