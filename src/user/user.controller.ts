import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDTO } from './dto/createUser';
import { RequestUserCreationDTO } from './dto/requestUserCreation';
import { UserService } from './user.service';

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
  createUser() {
    return this.userService.createUser();
  }
}
