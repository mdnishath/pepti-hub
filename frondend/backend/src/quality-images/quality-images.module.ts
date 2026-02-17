import { Module } from '@nestjs/common';
import { QualityImagesController } from './quality-images.controller';
import { QualityImagesService } from './quality-images.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QualityImagesController],
  providers: [QualityImagesService],
  exports: [QualityImagesService],
})
export class QualityImagesModule {}
