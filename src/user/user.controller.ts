import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Request as Req } from 'express';
import { AuthService } from '../auth/auth.service';
import { CreateUserDTO } from './dto/createUser';
import { RequestUserCreationDTO } from './dto/requestUserCreation';
import { UnblockUserDto } from './dto/unblockUser';
import { UserService } from './user.service';

export type RequestWithUser = Req & { user: User };

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Post('request')
  async requestUserCreation(
    @Body() { username, email, verificationUrl }: RequestUserCreationDTO,
  ) {
    await this.userService.requestUserCreation(
      username,
      email,
      verificationUrl,
    );
  }

  @Post()
  createUser(@Body() { token, password }: CreateUserDTO) {
    return this.userService.createUser(token, password);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @Post('unblock')
  unblockUser(@Body() data: UnblockUserDto) {
    return this.userService.unblockUser(data);
  }

  @Get('username-exists')
  usernameExists(@Query('username') username: string) {
    return this.userService.usernameExists(username);
  }
}
