import { faker } from '@faker-js/faker';
import { MailerModule } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { resolve } from 'path';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { encrypt } from '../utils/encryption';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.load(resolve(__dirname, '../config', '**/!(*.d).{ts,js}')),
        MailerModule.forRootAsync({
          useFactory: (config: ConfigService) => config.get('mailer'),
          inject: [ConfigService],
        }),
      ],
      providers: [AuthService, PrismaService, JwtService, EmailService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('validateUser should return user if the email and password is valid', async () => {
    const secret = faker.random.word();
    const user = {
      id: faker.random.alphaNumeric(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: await encrypt('i love banana', secret),
      trysCount: 0,
      secret,
    };
    prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
    prismaService.user.update = jest.fn().mockResolvedValue(user);
    const result = await service.validateUser(user.username, 'i love banana');
    expect(result).toEqual(user);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { username: user.username },
    });
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { trysCount: 0 },
    });
  });

  it('validatorUser should return null if the email is invalid', async () => {
    prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
    const result = await service.validateUser(
      faker.internet.userName(),
      'i love banana',
    );
    expect(result).toBeNull();
  });

  it('validatorUser should return null if the trysCount is greater or equal to 20', async () => {
    const secret = faker.random.word();
    const user = {
      id: faker.random.alphaNumeric(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: await encrypt('i love banana', secret),
      trysCount: 20,
      secret,
    };
    prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
    const result = await service.validateUser(user.username, 'i love banana');
    expect(result).toBeNull();
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { username: user.username },
    });
  });

  it('validatorUser should return null if the password is invalid', async () => {
    const secret = faker.random.word();
    const user = {
      id: faker.random.alphaNumeric(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: await encrypt('i love banana', secret),
      trysCount: 0,
      secret,
    };
    prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
    prismaService.user.update = jest.fn().mockResolvedValue(user);
    const result = await service.validateUser(user.username, 'i love apple');
    expect(result).toBeNull();
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { username: user.username },
    });
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { trysCount: user.trysCount + 1 },
    });
  });

  it('validatorUser should send an email if it is the 19 to 20th try and return null', async () => {
    const secret = faker.random.word();
    const user = {
      id: faker.random.alphaNumeric(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: await encrypt('i love banana', secret),
      trysCount: 19,
      secret,
    };
    prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
    prismaService.user.update = jest.fn().mockResolvedValue({
      ...user,
      trysCount: 20,
    });
    emailService.sendBlockedAccountNotice = jest.fn().mockResolvedValue(true);
    const result = await service.validateUser(user.username, 'wrong password');
    expect(result).toBeNull();
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { username: user.username },
    });
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { trysCount: user.trysCount + 1 },
    });
    const unblockUrl = (emailService.sendBlockedAccountNotice as jest.Mock).mock
      .calls[0][1];
    expect(emailService.sendBlockedAccountNotice).toHaveBeenCalledWith(
      user.email,
      unblockUrl,
    );
  });

  it('login should return a token', async () => {
    const secret = faker.random.word();
    const user = {
      id: faker.random.alphaNumeric(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: await encrypt('i love banana', secret),
      trysCount: 0,
      role: Role.USER,
      secret,
      updatedAt: faker.date.past(),
      createdAt: faker.date.past(),
    };
    jwtService.sign = jest.fn().mockReturnValue('token');
    const result = await service.login(user);
    expect(result).toEqual({
      createdAt: user.createdAt,
      email: user.email,
      id: user.id,
      token: 'token',
      updatedAt: user.updatedAt,
      username: user.username,
    });
  });
});
