const { z } = require('zod');

const emailSchema = z
  .string({ required_error: 'O e-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .min(1, 'O e-mail não pode ficar em branco')
  .email('Formato de e-mail inválido');

const senhaSchema = z
  .string({ required_error: 'A senha é obrigatória' })
  .min(6, 'A senha deve ter no mínimo 6 caracteres');

// RF01 - Cadastrar Nutricionista
const cadastrarNutricionistaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto'),
  email: emailSchema,
  senha: senhaSchema,
  crn: z.string().trim().min(3, 'CRN inválido'),
});

// RF02 - Login Nutricionista / RF16 - Login Paciente
const loginSchema = z.object({
  email: emailSchema,
  senha: senhaSchema,
});

// RF03 - Recuperar Senha
const solicitarRecuperacaoSenhaSchema = z.object({
  email: emailSchema,
});

const redefinirSenhaSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  novaSenha: senhaSchema,
});

// RF04 - Cadastrar Paciente (o nutricionista cadastra, sistema gera senha - RN08/RF04 include Gerar senha de login)
const cadastrarPacienteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto'),
  email: emailSchema,
  idade: z.number().int().positive().optional(),
  sexo: z.string().trim().optional(),
  alturaCm: z.number().positive().optional(),
  pesoInicialKg: z.number().positive().optional(),
  pesoMetaKg: z.number().positive().optional(),
  objetivo: z.string().trim().optional(),
  alergias: z.string().trim().optional(),
  historicoClinico: z.string().trim().optional(),
});

module.exports = {
  emailSchema,
  senhaSchema,
  cadastrarNutricionistaSchema,
  loginSchema,
  solicitarRecuperacaoSenhaSchema,
  redefinirSenhaSchema,
  cadastrarPacienteSchema,
};
