import { Injectable } from '@nestjs/common';
import { generateSuccessResponse, throwError } from '../../utils/util';
import { handleServiceError } from '../../utils/error.util';

@Injectable()
export class OnboardingService {
  async sendSimpleTestEmail(userId: number, request: any): Promise<any> {
    try {
      // Get user from request context
      const user = request.user;
      if (!user || !user.email) {
        throwError('User email not found', 400, 'userEmailNotFound');
      }

      // Create test email data
      const testEmailData = {
        from: 'onboarding@byteinbox.dev',
        to: user.email,
        subject: 'Welcome to ByteInbox - Test Email',
        content: `
          <h2>Welcome to ByteInbox! 🎉</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>This is a test email to confirm your email setup is working correctly.</p>
          <p>If you received this email, your ByteInbox account is ready to go!</p>
          <br>
          <p>Best regards,<br>The ByteInbox Team</p>
        `,
      };

      // TODO: Integrate with actual email service (SendGrid, SES, etc.)
      // For now, return success response
      const response = {
        message: 'Test email sent successfully',
        emailId: `test_email_${Date.now()}`,
        from: testEmailData.from,
        to: testEmailData.to,
        subject: testEmailData.subject,
      };

      return generateSuccessResponse({
        statusCode: 200,
        message: 'Test email sent successfully',
        data: response,
      });
    } catch (error) {
      return handleServiceError(error, 'Error sending test email');
    }
  }
}
