import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QualityImagesService } from './quality-images.service';
import { CreateQualityImageDto } from './dto/create-quality-image.dto';
import { UpdateQualityImageDto } from './dto/update-quality-image.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Quality Images')
@Controller('quality-images')
export class QualityImagesController {
  constructor(private readonly qualityImagesService: QualityImagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new quality image' })
  @ApiResponse({ status: 201, description: 'Quality image created successfully' })
  create(@Body() createQualityImageDto: CreateQualityImageDto, @TenantId() tenantId: string) {
    return this.qualityImagesService.create(createQualityImageDto, tenantId);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all quality images' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Quality images retrieved successfully' })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.qualityImagesService.findAll(tenantId, page, limit, isActive);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a quality image by ID' })
  @ApiResponse({ status: 200, description: 'Quality image retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Quality image not found' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.qualityImagesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a quality image' })
  @ApiResponse({ status: 200, description: 'Quality image updated successfully' })
  @ApiResponse({ status: 404, description: 'Quality image not found' })
  update(
    @Param('id') id: string,
    @Body() updateQualityImageDto: UpdateQualityImageDto,
    @TenantId() tenantId: string,
  ) {
    return this.qualityImagesService.update(id, updateQualityImageDto, tenantId);
  }

  @Patch(':id/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder a quality image' })
  @ApiResponse({ status: 200, description: 'Quality image reordered successfully' })
  @ApiResponse({ status: 404, description: 'Quality image not found' })
  reorder(
    @Param('id') id: string,
    @Body('order') order: number,
    @TenantId() tenantId: string,
  ) {
    return this.qualityImagesService.reorder(id, order, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a quality image' })
  @ApiResponse({ status: 200, description: 'Quality image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Quality image not found' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.qualityImagesService.remove(id, tenantId);
  }
}
