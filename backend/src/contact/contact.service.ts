import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(createContactDto: CreateContactDto, tenantId: string) {
    try {
      const contact = await this.prisma.contact.create({
        data: {
          ...createContactDto,
          tenantId,
        },
      });

      // Get tenant name and email config for notification
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          emailFrom: true,
          contactNotificationEmail: true,
          smtpConfig: true,
        },
      });

      // Send email notification (non-blocking)
      // Uses tenant-specific SMTP if configured, otherwise falls back to global config
      this.emailService.sendContactNotification({
        name: createContactDto.name,
        email: createContactDto.email,
        message: createContactDto.message,
        tenantName: tenant?.name || 'Pepti Hub',
        tenantEmailFrom: tenant?.emailFrom || undefined,
        tenantContactEmail: tenant?.contactNotificationEmail || undefined,
        tenantSmtpConfig: tenant?.smtpConfig || undefined,
      }).catch(err => {
        this.logger.error(`Failed to send contact email notification: ${err.message}`);
      });

      return contact;
    } catch (error) {
      this.logger.error(`Failed to create contact: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to submit contact form. Please try again later.');
    }
  }

  async findAll(tenantId: string, isRead?: boolean) {
    try {
      const where: any = { tenantId };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      return await this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch contacts: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch contacts. Please try again later.');
    }
  }

  async findOne(id: string, tenantId: string) {
    try {
      const contact = await this.prisma.contact.findFirst({
        where: { id, tenantId },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      return contact;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch contact: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch contact. Please try again later.');
    }
  }

  async update(id: string, updateContactDto: UpdateContactDto, tenantId: string) {
    try {
      const contact = await this.findOne(id, tenantId);

      return await this.prisma.contact.update({
        where: { id: contact.id },
        data: updateContactDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update contact: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update contact. Please try again later.');
    }
  }

  async remove(id: string, tenantId: string) {
    try {
      const contact = await this.findOne(id, tenantId);

      await this.prisma.contact.delete({
        where: { id: contact.id },
      });

      return { message: 'Contact deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete contact: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete contact. Please try again later.');
    }
  }

  async getStats(tenantId: string) {
    try {
      const [total, unread] = await Promise.all([
        this.prisma.contact.count({ where: { tenantId } }),
        this.prisma.contact.count({ where: { tenantId, isRead: false } }),
      ]);

      return {
        total,
        unread,
        read: total - unread,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch contact stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch contact statistics. Please try again later.');
    }
  }
}
