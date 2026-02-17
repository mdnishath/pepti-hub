# Email Notifications Setup Guide

This guide will help you configure email notifications for your e-commerce platform. You'll receive emails when:
- Someone submits a contact form
- Someone places an order

## Quick Setup (Gmail - Recommended for testing)

### Step 1: Get a Gmail App Password

1. Go to your Google Account: https://myaccount.google.com
2. Select **Security** from the left menu
3. Under "Signing in to Google," select **2-Step Verification** (you must enable this first if not already enabled)
4. Scroll down and select **App passwords**
5. Select **Mail** as the app and **Other** as the device
6. Enter "Pepti Hub Backend" as the name
7. Click **Generate**
8. **Copy the 16-character password** (you won't be able to see it again)

### Step 2: Update Your .env File

Open `E:\backend\.env` and add these lines:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=Pepti Hub <your-email@gmail.com>
ADMIN_EMAIL=your-email@gmail.com
APP_URL=http://localhost:3001
```

Replace:
- `your-email@gmail.com` with your Gmail address
- `xxxx xxxx xxxx xxxx` with the App Password you generated (remove spaces)
- `ADMIN_EMAIL` with the email where you want to receive notifications

### Step 3: Restart the Backend Server

```bash
cd E:\backend
npm run start:dev
```

### Step 4: Test the Email Service

You can test if the email configuration is working by:
1. Submitting a contact form on your website
2. Placing a test order

Check the backend logs for any email-related errors.

## Alternative Email Providers

### Using Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Pepti Hub <your-email@outlook.com>
ADMIN_EMAIL=your-email@outlook.com
```

### Using Yahoo Mail

1. Enable "Allow apps that use less secure sign in" in Yahoo settings
2. Use these settings:

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Pepti Hub <your-email@yahoo.com>
ADMIN_EMAIL=your-email@yahoo.com
```

### Using SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com (free tier available)
2. Create an API Key
3. Use these settings:

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=Pepti Hub <noreply@yourdomain.com>
ADMIN_EMAIL=admin@yourdomain.com
```

### Using AWS SES (Recommended for Production)

1. Set up AWS SES and verify your domain/email
2. Create SMTP credentials in AWS console
3. Use these settings:

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
EMAIL_FROM=Pepti Hub <noreply@yourdomain.com>
ADMIN_EMAIL=admin@yourdomain.com
```

## Email Notification Details

### Contact Form Notifications

When someone submits a contact form, you'll receive an email with:
- Customer name
- Customer email
- Message content
- Tenant name
- Submission timestamp

### Order Notifications

When someone places an order, you'll receive an email with:
- Order ID
- Customer name and email
- Total amount
- Number of items
- Link to view order in admin panel

## Troubleshooting

### "EAUTH" Error
- **Gmail**: Make sure you're using an App Password, not your regular password
- **Other providers**: Check your username and password are correct

### "ECONNREFUSED" Error
- Check your EMAIL_HOST is correct
- Check your EMAIL_PORT is correct (usually 587 for TLS, 465 for SSL)
- Check if your firewall is blocking outgoing SMTP connections

### "Invalid login" Error
- Verify your EMAIL_USER and EMAIL_PASSWORD are correct
- For Gmail, ensure 2-Step Verification is enabled and you're using an App Password
- For other providers, check if you need to enable "less secure apps" or create an app-specific password

### Emails Not Arriving
- Check spam/junk folder
- Verify ADMIN_EMAIL is set to the correct email address
- Check backend logs for error messages
- Try sending a test email to verify the configuration

### No Error But Not Sending
- The email service is non-blocking, so errors won't prevent form submission/order creation
- Check the backend logs carefully for email-related warnings
- Verify your email provider allows SMTP access

## Production Recommendations

For production environments:

1. **Use a dedicated email service** like SendGrid, AWS SES, or Mailgun
2. **Use a dedicated domain** (e.g., noreply@yourdomain.com)
3. **Set up SPF, DKIM, and DMARC** records for better deliverability
4. **Monitor email sending** with your provider's dashboard
5. **Set up email templates** with your branding
6. **Consider rate limits** of your email provider

## Security Best Practices

1. **Never commit** your `.env` file to version control
2. **Use App Passwords** instead of your main email password
3. **Rotate credentials** regularly
4. **Use environment variables** for all sensitive data
5. **Monitor** for unauthorized access

## Need Help?

If you're having trouble setting up email notifications:

1. Check the backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Try with Gmail first (easiest to test)
4. Make sure 2-Step Verification is enabled for Gmail
5. Double-check you're using an App Password, not your regular password

## Email Service Status

When the backend starts, you'll see one of these messages:

- ✅ `Email service is ready to send emails` - Everything is configured correctly
- ⚠️ `Email service connection failed` - Check your configuration

Even if the email service fails to connect, your application will continue to work normally. Email notifications simply won't be sent until the configuration is fixed.
