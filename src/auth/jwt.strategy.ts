import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import app from '../config/app';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: app.appSecret,
    });
  }

  async validate(payload: { id: string; email: string; secret: string }) {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
    });
    if (!user || user.secret !== payload.secret) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
