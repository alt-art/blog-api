import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { ConfigService } from 'nestjs-config';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { compare } from '../utils/encryption';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!user) {
      return null;
    }
    if (user.trysCount >= 20) {
      return null;
    }
    if (!(await compare(password, user.password, user.secret))) {
      const { trysCount } = await this.prismaService.user.update({
        where: { id: user.id },
        data: { trysCount: user.trysCount + 1 },
      });
      if (trysCount >= 20) {
        const token = this.jwtService.sign({
          id: user.id,
          email: user.email,
          secret: user.secret,
        });
        const unblockAccountUrl = `${this.config.get(
          'app.unblockAccountUrl',
        )}?token=${token}`;
        await this.emailService.sendBlockedAccountNotice(
          user.email,
          unblockAccountUrl,
        );
      }
      return null;
    }
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { trysCount: 0 },
    });
    return user;
  }

  async login(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      secret: user.secret,
    };
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token: this.jwtService.sign(payload),
    };
  }
}
