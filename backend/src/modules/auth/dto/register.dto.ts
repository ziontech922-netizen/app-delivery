import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email!: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  password!: string;

  @IsString({ message: 'Nome é obrigatório' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  firstName!: string;

  @IsString({ message: 'Sobrenome é obrigatório' })
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  @MinLength(2, { message: 'Sobrenome deve ter no mínimo 2 caracteres' })
  lastName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{10,14}$/, {
    message: 'Telefone inválido. Use formato internacional (+5511999999999)',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role inválida' })
  role?: UserRole;

  @IsOptional()
  acceptedTerms?: boolean;

  @IsOptional()
  acceptedPrivacy?: boolean;
}
