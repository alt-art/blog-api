import { IsJWT, IsNotEmpty, IsString } from 'class-validator';
import { IsValidPassword } from '../../utils/validPassword';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  @IsJWT()
  token: string;

  @IsString()
  @IsNotEmpty()
  @IsValidPassword()
  password: string;
}
