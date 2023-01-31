import { IsOptional, IsString } from 'class-validator';

export class UserEditDto {
  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  email: string;
}
