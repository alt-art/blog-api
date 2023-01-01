import { MailerModule } from '@nestjs-modules/mailer';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { resolve } from 'path';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { UserService } from './user.service';
import { faker } from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import { HttpException, HttpStatus } from '@nestjs/common';
import { encrypt } from '../utils/encryption';

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
      const payload = jwt.verify(
        token,
        config.get('app.emailSecret'),
      ) as Payload;
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

  describe('create user', () => {
    it('should create a user with the information provided by the token and password', async () => {
      const user = {
        id: faker.random.numeric(),
        email: faker.internet.email(),
        username: faker.internet.userName(),
      };
      const token = jwt.sign(
        {
          email: user.email,
          username: user.username,
        },
        config.get('app.emailSecret'),
      );
      const password = faker.internet.password();
      jest.spyOn(jwt, 'sign').mockImplementation(() => 'dummy token');
      prismaService.user.create = jest.fn().mockResolvedValue(user);
      const response = await service.createUser(token, password);
      expect(response).toEqual({ ...user, token: 'dummy token' });
    });

    it('should throw an error if the token is invalid', async () => {
      const token = 'invalid token';
      const password = faker.internet.password();
      prismaService.user.create = jest.fn();
      try {
        await service.createUser(token, password);
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('Invalid token');
        expect(e.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('shold unblock a user', () => {
    it('should unblock a user', async () => {
      const password = faker.internet.password();
      const secret = faker.random.alphaNumeric(10);
      const user = {
        id: faker.random.numeric(),
        email: faker.internet.email(),
        username: faker.internet.userName(),
        secret,
        password: await encrypt(password, secret),
        trysCount: 20,
      };
      prismaService.user.findFirst = jest.fn().mockResolvedValue(user);
      prismaService.user.update = jest.fn().mockResolvedValue(user);
      await service.unblockUser({
        secret: secret,
        password: password,
      });
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          secret: secret,
        },
      });
      expect(prismaService.user.update).toHaveBeenCalled();
    });
  });
});
