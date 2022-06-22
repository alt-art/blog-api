import { IsEmail, IsNotEmpty, IsString, IsUrl, Length } from 'class-validator';

export class RequestUserCreationDTO {
  @IsString()
  @IsNotEmpty()
  @Length(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  verificationUrl: string;
}
