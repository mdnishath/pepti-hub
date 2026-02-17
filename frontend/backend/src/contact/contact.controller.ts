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
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public() // Allow anyone to submit contact form
  @Post()
  @ApiOperation({ summary: 'Submit a contact form (Public endpoint)' })
  @ApiResponse({ status: 201, description: 'Contact submitted successfully' })
  create(@Body() createContactDto: CreateContactDto, @TenantId() tenantId: string) {
    return this.contactService.create(createContactDto, tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all contact submissions (Admin only)' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Contacts retrieved successfully' })
  findAll(@Query('isRead') isRead?: string, @TenantId() tenantId: string = 'pepti-hub') {
    const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.contactService.findAll(tenantId, isReadBool);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('stats')
  @ApiOperation({ summary: 'Get contact statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contact stats retrieved successfully' })
  getStats(@TenantId() tenantId: string) {
    return this.contactService.getStats(tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contact retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.contactService.findOne(id, tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update contact (e.g., mark as read) (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @TenantId() tenantId: string) {
    return this.contactService.update(id, updateContactDto, tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.contactService.remove(id, tenantId);
  }
}
