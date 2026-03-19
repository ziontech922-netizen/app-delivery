import { IsString, IsNotEmpty, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SocialProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
}

class AppleUserData {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

export class SocialAuthDto {
  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @ValidateNested()
  @Type(() => AppleUserData)
  @IsOptional()
  userData?: AppleUserData;
}
