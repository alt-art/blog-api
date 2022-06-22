import { Module } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, EmailService, PrismaService],
})
export class UserModule {}
