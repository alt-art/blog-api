import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { ConfigService } from 'nestjs-config';
import app from '../config/app';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { encrypt, generateSecret } from '../utils/encryption';

@Injectable()
export class UserService {
  constructor(
    private emailService: EmailService,
    private prismaService: PrismaService,
    private config: ConfigService,
  ) {}

  async requestUserCreation(
    username: string,
    email: string,
    verificationUrl: string,
  ) {
    const emailExists = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (emailExists) {
      throw new HttpException(
        'A user with this email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const usernameExists = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (usernameExists) {
      throw new HttpException(
        'A user with this username already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const token = sign({ email, username }, this.config.get('app.emailSecret'));
    return this.emailService.sendEmailVerification(
      email,
      `${verificationUrl}?token=${token}`,
    );
  }

  async createUser(emailToken: string, password: string) {
    try {
      type Payload = {
        email: string;
        username: string;
      };
      const { email, username } = verify(
        emailToken,
        this.config.get('app.emailSecret'),
      ) as Payload;
      const secret = await generateSecret();
      const hash = await encrypt(password, secret);
      const user = await this.prismaService.user.create({
        data: {
          email,
          username,
          password: hash,
          secret,
        },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });
      const token = sign({ id: user.id, secret }, app.appSecret);
      return {
        token,
        ...user,
      };
    } catch (error) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
  }

  async unblockUser(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    if (user.trysCount >= 20) {
      await this.prismaService.user.update({
        where: { id },
        data: {
          trysCount: 0,
        },
      });
    }
  }
}
