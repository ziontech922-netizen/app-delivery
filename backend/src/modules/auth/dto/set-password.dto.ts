import { IsString, MinLength, Matches } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: 'Senha deve conter maiúscula, minúscula, número e caractere especial',
  })
  newPassword!: string;
}
