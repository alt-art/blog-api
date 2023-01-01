import { IsNotEmpty, IsString } from 'class-validator';
import { IsValidPassword } from '../../utils/validPassword';

export class UnblockUserDto {
  @IsString()
  @IsNotEmpty()
  secret: string;

  @IsString()
  @IsNotEmpty()
  @IsValidPassword()
  password: string;
}
