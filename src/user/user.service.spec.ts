import { MailerModule } from '@nestjs-modules/mailer';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { resolve } from 'path';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { UserService } from './user.service';
import { faker } from '@faker-js/faker';
import { verify } from 'jsonwebtoken';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;
  let emailService: EmailService;
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
      providers: [UserService, EmailService, PrismaService],
    }).compile();
    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    config = module.get<ConfigService>(ConfigService);
  });

  describe('request user creation', () => {
    it('should send an email with a token', async () => {
      type Payload = {
        email: string;
        username: string;
      };
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      emailService.sendEmailVerification = jest.fn();
      const userCreationRequest = {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        url: faker.internet.url(),
      };
      await service.requestUserCreation(
        userCreationRequest.username,
        userCreationRequest.email,
        userCreationRequest.url,
      );
      const verificationUrl = (emailService.sendEmailVerification as jest.Mock)
        .mock.calls[0][1];
      const token = verificationUrl.split('=').pop();
      const payload = verify(token, config.get('app.emailSecret')) as Payload;
      expect(payload.username).toBe(userCreationRequest.username);
      expect(payload.email).toBe(userCreationRequest.email);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          username: userCreationRequest.username,
        },
      });
      expect(emailService.sendEmailVerification).toHaveBeenCalledWith(
        userCreationRequest.email,
        verificationUrl,
      );
    });

    it('should throw an error if the username is already taken', async () => {
      const userCreationRequest = {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        url: faker.internet.url(),
      };
      prismaService.user.findUnique = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 1,
          username: userCreationRequest.username,
          email: userCreationRequest.email,
        });
      emailService.sendEmailVerification = jest.fn();
      try {
        await service.requestUserCreation(
          userCreationRequest.username,
          userCreationRequest.email,
          userCreationRequest.url,
        );
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('A user with this username already exists');
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
      expect(emailService.sendEmailVerification).not.toHaveBeenCalled();
    });

    it('should throw an error if the email is already taken', async () => {
      const userCreationRequest = {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        url: faker.internet.url(),
      };
      prismaService.user.findUnique = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          username: userCreationRequest.username,
          email: userCreationRequest.email,
        })
        .mockResolvedValueOnce(null);
      emailService.sendEmailVerification = jest.fn();
      try {
        await service.requestUserCreation(
          userCreationRequest.username,
          userCreationRequest.email,
          userCreationRequest.url,
        );
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('A user with this email already exists');
        expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
      expect(emailService.sendEmailVerification).not.toHaveBeenCalled();
    });
  });
});
