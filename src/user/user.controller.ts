import { Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('request')
  requestUserCreation() {
    return this.userService.requestUserCreation();
  }

  @Post()
  createUser() {
    return this.userService.createUser();
  }
}
