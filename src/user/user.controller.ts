import { Body, Controller, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { Request as Req } from 'express';
import { CreateUserDTO } from './dto/createUser';
import { RequestUserCreationDTO } from './dto/requestUserCreation';
import { UserService } from './user.service';

export type RequestWithUser = Req & { user: User };

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

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
}
