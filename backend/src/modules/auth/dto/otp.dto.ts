import { IsString, IsNotEmpty, IsEnum, Matches, Length } from 'class-validator';

export enum OtpType {
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,11}$/, { message: 'Telefone inválido (10-11 dígitos)' })
  phone!: string;

  @IsEnum(OtpType)
  type!: OtpType;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,11}$/, { message: 'Telefone inválido' })
  phone!: string;

  @IsString()
  @Length(6, 6, { message: 'Código deve ter 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'Código deve conter apenas números' })
  code!: string;
}
