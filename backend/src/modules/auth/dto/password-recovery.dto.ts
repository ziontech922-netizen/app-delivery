import { IsString, IsNotEmpty, IsEmail, MinLength, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: 'Senha deve conter maiúscula, minúscula, número e caractere especial',
  })
  newPassword!: string;
}

export class ValidateResetTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
