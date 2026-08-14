import { z } from 'zod';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const emailSchema = z
  .string({ required_error: 'O e-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .min(1, 'O e-mail não pode ficar em branco')
  .email('Formato de e-mail inválido')
  .regex(emailRegex, 'Insira um e-mail válido (ex: usuario@dominio.com)');

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'A senha é obrigatória' })
    .min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const userSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(2, 'Nome muito curto'),
  email: emailSchema,
});