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
import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Bundles')
@Controller('bundles')
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new bundle' })
  @ApiResponse({ status: 201, description: 'Bundle created successfully' })
  @ApiResponse({ status: 409, description: 'Bundle already exists' })
  create(@Body() createBundleDto: CreateBundleDto, @TenantId() tenantId: string) {
    return this.bundlesService.create(createBundleDto, tenantId);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all bundles' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Bundles retrieved successfully' })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.bundlesService.findAll(tenantId, page, limit, isActive);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get a bundle by slug' })
  @ApiResponse({ status: 200, description: 'Bundle retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  findBySlug(@Param('slug') slug: string, @TenantId() tenantId: string) {
    return this.bundlesService.findBySlug(slug, tenantId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a bundle by ID' })
  @ApiResponse({ status: 200, description: 'Bundle retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.bundlesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a bundle' })
  @ApiResponse({ status: 200, description: 'Bundle updated successfully' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  update(
    @Param('id') id: string,
    @Body() updateBundleDto: UpdateBundleDto,
    @TenantId() tenantId: string,
  ) {
    return this.bundlesService.update(id, updateBundleDto, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a bundle' })
  @ApiResponse({ status: 200, description: 'Bundle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.bundlesService.remove(id, tenantId);
  }
}
