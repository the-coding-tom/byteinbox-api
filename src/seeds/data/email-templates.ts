import { PrismaClient } from '@prisma/client';

export const defaultEmailTemplates = [
  {
    name: 'otp-verification',
    subject: 'Your Login Verification Code',
    description: 'Template for sending OTP verification codes via email',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Verification Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 24px;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 8px;
            border: 2px solid #e9ecef;
            letter-spacing: 4px;
            color: #2c3e50;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Login Verification Code</h1>
        </div>
        
        <div class="content">
            {{#if firstName}}
                <p>Hello {{firstName}},</p>
            {{else}}
                <p>Hello,</p>
            {{/if}}
            
            <p>Your verification code is:</p>
            
            <div class="otp-code">{{otp}}</div>
            
            <p>This code will expire in <strong>{{expiryMinutes}} minutes</strong>.</p>
            
            <div class="warning">
                <strong>Security Notice:</strong> If you didn't request this code, please ignore this email and consider changing your password.
            </div>
        </div>
        
        <div class="footer">
            <p>Best regards,<br><strong>{{appName}}</strong></p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`,
    isDefault: true,
  },
  {
    name: 'email-verification',
    subject: 'Verify Your Email Address',
    description: 'Template for email verification during registration',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email Address</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 24px;
        }
        .verify-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .verify-button:hover {
            background-color: #2980b9;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email Address</h1>
        </div>
        
        <div class="content">
            {{#if firstName}}
                <p>Hello {{firstName}},</p>
            {{else}}
                <p>Hello,</p>
            {{/if}}
            
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{verificationUrl}}" class="verify-button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3498db;">{{verificationUrl}}</p>
            
            <p>This verification link will expire in <strong>{{expiryHours}} hours</strong>.</p>
            
            <div class="warning">
                <strong>Security Notice:</strong> If you didn't create an account, please ignore this email.
            </div>
        </div>
        
        <div class="footer">
            <p>Best regards,<br><strong>{{appName}}</strong></p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`,
    isDefault: true,
  },
  {
    name: 'password-reset',
    subject: 'Reset Your Password',
    description: 'Template for password reset emails',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #e74c3c;
            margin: 0;
            font-size: 24px;
        }
        .reset-button {
            display: inline-block;
            background-color: #e74c3c;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .reset-button:hover {
            background-color: #c0392b;
        }
        .content {
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .warning {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        
        <div class="content">
            {{#if firstName}}
                <p>Hello {{firstName}},</p>
            {{else}}
                <p>Hello,</p>
            {{/if}}
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="{{resetUrl}}" class="reset-button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #e74c3c;">{{resetUrl}}</p>
            
            <p>This password reset link will expire in <strong>{{expiryMinutes}} minutes</strong>.</p>
            
            <div class="info">
                <strong>Important:</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> Never share this link with anyone. Our support team will never ask for your password or this reset link.
            </div>
        </div>
        
        <div class="footer">
            <p>Best regards,<br><strong>{{appName}}</strong></p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`,
    isDefault: true,
  },
];

export async function seedEmailTemplates(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding email templates...');

  for (const templateData of defaultEmailTemplates) {
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { name: templateData.name },
    });

    if (!existingTemplate) {
      await prisma.emailTemplate.create({
        data: {
          name: templateData.name,
          subject: templateData.subject,
          htmlContent: templateData.htmlContent,
          isDefault: templateData.isDefault,
          isActive: true,
        },
      });
      console.log(`✅ Created email template: ${templateData.name}`);
    } else {
      console.log(`⏭️  Email template already exists: ${templateData.name}`);
    }
  }

  console.log('✅ Email templates seeding completed!');
}
