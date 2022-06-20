import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  sendEmailVerification(email: string, verificationUrl: string) {
    return this.mailerService.sendMail({
      to: email,
      subject: `Email verification on ${this.config.get('app.siteName')}`,
      template: 'email-verification',
      context: {
        siteName: this.config.get('app.siteName'),
        verificationUrl,
      },
    });
  }
}
