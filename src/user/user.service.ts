import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { ConfigService } from 'nestjs-config';
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

  createUser() {
    throw new HttpException('Not implemented yet', 501);
  }
}
