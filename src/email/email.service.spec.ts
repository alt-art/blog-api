import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { resolve } from 'path';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.load(resolve(__dirname, '../config', '**/!(*.d).{ts,js}')),
        MailerModule.forRootAsync({
          useFactory: (config: ConfigService) => config.get('mailer'),
          inject: [ConfigService],
        }),
      ],
      providers: [EmailService],
    }).compile();
    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
    config = module.get<ConfigService>(ConfigService);
  });

  it('should send a verification email', async () => {
    mailerService.sendMail = jest.fn();
    service.sendEmailVerification('josh@test.com', 'http://test.com');
    expect(mailerService.sendMail).toHaveBeenCalled();
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'josh@test.com',
      subject: `Email verification on ${config.get('app.siteName')}`,
      template: 'email-verification',
      context: {
        siteName: config.get('app.siteName'),
        verificationUrl: 'http://test.com',
      },
    });
  });

  it('should send a blocked account notice', async () => {
    mailerService.sendMail = jest.fn();
    service.sendBlockedAccountNotice('josh@test.com', 'http://test.com');
    expect(mailerService.sendMail).toHaveBeenCalled();
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'josh@test.com',
      subject: `Your account has been blocked on ${config.get('app.siteName')}`,
      template: 'blocked-account',
      context: {
        siteName: config.get('app.siteName'),
        unblockUrl: 'http://test.com',
      },
    });
  });
});
