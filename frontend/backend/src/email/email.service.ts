import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    // Only create global transporter if credentials are provided in .env
    const emailUser = this.configService.get<string>('email.user');
    const emailPassword = this.configService.get<string>('email.password');

    if (emailUser && emailPassword) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('email.host') || 'smtp.gmail.com',
        port: this.configService.get<number>('email.port') || 587,
        secure: this.configService.get<boolean>('email.secure') || false,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      // Verify connection configuration
      this.verifyConnection();
    } else {
      this.logger.warn('Global email credentials not configured in .env. Email service will only work with tenant-specific SMTP settings.');
    }
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('Email service is ready to send emails');
    } catch (error) {
      this.logger.error('Email service connection failed:', error.message);
      this.logger.warn('Email notifications will not work until configuration is fixed');
    }
  }

  /**
   * Create a transporter using tenant-specific SMTP config if provided
   * Otherwise, use the global transporter from environment variables
   */
  private createTransporter(smtpConfig?: any) {
    if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.password) {
      return nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure || false,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.password,
        },
      });
    }

    // Return global transporter if available
    if (this.transporter) {
      return this.transporter;
    }

    // If no transporter available, throw error
    throw new Error('No SMTP configuration available. Please configure email settings in admin panel or .env file.');
  }

  async sendContactNotification(contactData: {
    name: string;
    email: string;
    message: string;
    tenantName?: string;
    tenantSmtpConfig?: any;
    tenantEmailFrom?: string;
    tenantContactEmail?: string;
  }) {
    try {
      // Check if admin email is configured
      if (!contactData.tenantContactEmail) {
        this.logger.warn('Admin email not configured in tenant settings. Email notification will not be sent.');
        return false;
      }

      // Use tenant-specific SMTP if available, otherwise use global
      const transporter = this.createTransporter(contactData.tenantSmtpConfig);
      const fromEmail = contactData.tenantEmailFrom || this.configService.get<string>('email.from') || 'noreply@example.com';
      const toEmail = contactData.tenantContactEmail;

      const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: `New Contact Form Submission - ${contactData.tenantName || 'Pepti Hub'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Name:</strong> ${contactData.name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong>
                <a href="mailto:${contactData.email}">${contactData.email}</a>
              </p>
              <p style="margin: 10px 0;"><strong>Tenant:</strong> ${contactData.tenantName || 'Pepti Hub'}</p>
            </div>

            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h3 style="color: #374151; margin-top: 0;">Message:</h3>
              <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${contactData.message}</p>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-radius: 8px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                💡 <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              This is an automated notification from your e-commerce platform.<br>
              Sent at ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      this.logger.log(`Contact notification email sent to ${toEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send contact notification email: ${error.message}`);
      // Don't throw error - we don't want to block the contact submission if email fails
      return false;
    }
  }

  async sendOrderNotification(orderData: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    itemCount: number;
    tenantName?: string;
    tenantSmtpConfig?: any;
    tenantEmailFrom?: string;
    tenantOrderEmail?: string;
  }) {
    try {
      // Check if admin email is configured
      if (!orderData.tenantOrderEmail) {
        this.logger.warn('Admin email not configured in tenant settings. Email notification will not be sent.');
        return false;
      }

      // Use tenant-specific SMTP if available, otherwise use global
      const transporter = this.createTransporter(orderData.tenantSmtpConfig);
      const fromEmail = orderData.tenantEmailFrom || this.configService.get<string>('email.from') || 'noreply@example.com';
      const toEmail = orderData.tenantOrderEmail;

      const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: `New Order Received - Order #${orderData.orderId.slice(0, 8)} - ${orderData.tenantName || 'Pepti Hub'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
              🎉 New Order Received!
            </h2>

            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0; color: #15803d;">Order Details</h3>
              <p style="margin: 10px 0;"><strong>Order ID:</strong> ${orderData.orderId}</p>
              <p style="margin: 10px 0;"><strong>Customer:</strong> ${orderData.customerName}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong>
                <a href="mailto:${orderData.customerEmail}">${orderData.customerEmail}</a>
              </p>
              <p style="margin: 10px 0;"><strong>Tenant:</strong> ${orderData.tenantName || 'Pepti Hub'}</p>
            </div>

            <div style="background-color: #ffffff; padding: 20px; border: 2px solid #16a34a; border-radius: 8px;">
              <h3 style="color: #374151; margin-top: 0;">Order Summary</h3>
              <p style="margin: 10px 0; font-size: 16px;">
                <strong>Total Items:</strong> ${orderData.itemCount}
              </p>
              <p style="margin: 10px 0; font-size: 20px; color: #16a34a;">
                <strong>Total Amount:</strong> $${orderData.totalAmount.toFixed(2)}
              </p>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚡ <strong>Action Required:</strong> Process this order as soon as possible. The customer is waiting for confirmation.
              </p>
            </div>

            <div style="margin-top: 20px; text-align: center;">
              <a href="${this.configService.get<string>('app.url')}/admin/orders"
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order in Admin Panel
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              This is an automated notification from your e-commerce platform.<br>
              Sent at ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      this.logger.log(`Order notification email sent to ${toEmail} for order ${orderData.orderId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send order notification email: ${error.message}`);
      // Don't throw error - we don't want to block the order if email fails
      return false;
    }
  }

  async sendTestEmail() {
    try {
      const mailOptions = {
        from: this.configService.get<string>('email.from'),
        to: 'test@example.com', // This method is not used in production
        subject: 'Test Email - E-Commerce Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Test Email</h2>
            <p>This is a test email from your e-commerce platform.</p>
            <p>If you received this email, your email configuration is working correctly!</p>
            <p style="color: #6b7280; font-size: 12px;">
              Sent at ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Test email sent successfully`);
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      this.logger.error(`Failed to send test email: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
