import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  requestUserCreation() {
    throw new HttpException('Not implemented yet', 501);
  }

  createUser() {
    throw new HttpException('Not implemented yet', 501);
  }
}
