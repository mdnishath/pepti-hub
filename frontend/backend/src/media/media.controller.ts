import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role, MediaType } from '@prisma/client';

// Multer configuration
const storage = diskStorage({
  destination: (req, file, cb) => {
    // Get tenant ID from header
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return cb(new Error('Tenant ID is required'), '');
    }

    // Create tenant-specific upload directory
    const uploadsDir = path.join(process.cwd(), 'uploads', tenantId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter to allow only images and videos
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/quicktime',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single media file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @TenantId() tenantId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const media = await this.mediaService.create(file, tenantId);
    return media;
  }

  @Post('upload-multiple')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple media files' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @TenantId() tenantId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const media = await this.mediaService.uploadMultiple(files, tenantId);
    return media;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all media files' })
  @ApiQuery({ name: 'type', required: false, enum: MediaType })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  findAll(
    @TenantId() tenantId: string,
    @Query('type') type?: MediaType,
  ) {
    return this.mediaService.findAll(tenantId, type);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a media file by ID' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.mediaService.findOne(id, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a media file' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.mediaService.remove(id, tenantId);
  }
}
