import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { compare } from '../utils/encryption';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (!user) {
      return null;
    }
    if (!(await compare(password, user.password, user.secret))) {
      return null;
    }
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
