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

// Campos vindos de formulários: string vazia/null vira "não informado"
const vazioParaUndefined = (v) => (v === '' || v === null ? undefined : v);
const numeroOpcional = z.preprocess(vazioParaUndefined, z.coerce.number().positive().optional());
const percentualOpcional = z.preprocess(vazioParaUndefined, z.coerce.number().min(0).max(100).optional());
const textoOpcional = z.preprocess((v) => (v === null ? undefined : v), z.string().trim().optional());

const dataSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD');
const horarioSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Horário inválido (HH:MM)');

const OBJETIVOS = ['emagrecimento', 'manutencao', 'hipertrofia', 'saude', 'performance'];

// RF01 - Cadastrar Nutricionista
const cadastrarNutricionistaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto'),
  email: emailSchema,
  senha: senhaSchema,
  crn: z.string().trim().min(3, 'CRN inválido'),
});

const atualizarNutricionistaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto'),
  email: emailSchema,
  crn: z.string().trim().min(3, 'CRN inválido'),
  telefone: textoOpcional,
});

// RF02 - Login Nutricionista / RF16 - Login Paciente
const loginSchema = z.object({
  email: emailSchema,
  senha: z.string({ required_error: 'A senha é obrigatória' }).min(1, 'A senha é obrigatória'),
});

// RF03 - Recuperar Senha
const solicitarRecuperacaoSenhaSchema = z.object({
  email: emailSchema,
});

const redefinirSenhaSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  novaSenha: senhaSchema,
});

const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Informe a senha atual'),
  novaSenha: senhaSchema,
});

// RF04 - Cadastrar Paciente (o nutricionista cadastra, sistema gera senha - RN08)
const dadosPacienteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto'),
  email: emailSchema,
  telefone: textoOpcional,
  idade: z.preprocess(vazioParaUndefined, z.coerce.number().int().positive().max(130).optional()),
  sexo: z.enum(['M', 'F']).optional(),
  alturaCm: numeroOpcional,
  pesoInicialKg: numeroOpcional,
  pesoAtualKg: numeroOpcional,
  pesoMetaKg: numeroOpcional,
  gorduraPct: percentualOpcional,
  massaMagraPct: percentualOpcional,
  objetivo: z.enum(OBJETIVOS).optional(),
  alergias: textoOpcional,
  historicoClinico: textoOpcional,
  estiloVida: textoOpcional,
  recordatorioAlimentar: textoOpcional,
  dataInicio: dataSchema.optional(),
});

const cadastrarPacienteSchema = dadosPacienteSchema;

// RF05 / RF08 - Editar paciente e dados clínicos (todos os campos opcionais)
const atualizarPacienteSchema = dadosPacienteSchema.partial();

// RN18 / RF24 - o paciente só edita dados pessoais
const atualizarPerfilPacienteSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto'),
  email: emailSchema,
  telefone: textoOpcional,
});

const preferenciasSchema = z.record(z.boolean());

// RF10 / RF11 / RF12 - Plano alimentar com refeições, alimentos e substitutos
const itemPlanoSchema = z.object({
  alimentoId: z.coerce.number().int().positive(),
  gramas: z.coerce.number().positive('Gramagem deve ser maior que zero'),
  substitutos: z
    .array(
      z.object({
        alimentoId: z.coerce.number().int().positive(),
        gramas: z.coerce.number().positive('Gramagem deve ser maior que zero'),
      })
    )
    .default([]),
});

const planoAlimentarSchema = z
  .object({
    nome: z.string().trim().min(2, 'Dê um nome ao plano'),
    kcalAlvo: z.coerce.number().int().positive('Informe as calorias alvo'),
    pctCarbo: z.coerce.number().int().min(0).max(100),
    pctProteina: z.coerce.number().int().min(0).max(100),
    pctGordura: z.coerce.number().int().min(0).max(100),
    refeicoes: z
      .array(
        z.object({
          nome: z.string().trim().min(1, 'Dê um nome à refeição'),
          horario: horarioSchema,
          itens: z.array(itemPlanoSchema).default([]),
        })
      )
      .min(1, 'O plano precisa de pelo menos uma refeição'),
  })
  .refine((p) => p.pctCarbo + p.pctProteina + p.pctGordura === 100, {
    message: 'Os macronutrientes devem somar 100%',
    path: ['pctCarbo'],
  });

// RF22 - Agendar consulta
const consultaSchema = z.object({
  pacienteId: z.string().uuid('Paciente inválido'),
  data: dataSchema,
  horario: horarioSchema,
  tipo: z.string().trim().min(1).default('Retorno'),
  observacoes: textoOpcional,
});

const atualizarConsultaSchema = consultaSchema.omit({ pacienteId: true }).partial();

// RF21 - Evolução de peso e medidas
const evolucaoSchema = z.object({
  data: dataSchema.optional(),
  pesoKg: z.coerce.number().min(20, 'Peso inválido').max(400, 'Peso inválido'),
  gorduraPct: percentualOpcional,
  massaMagraPct: percentualOpcional,
});

// RF20 / RF25 - Registrar consumo
const consumoSchema = z.object({
  data: dataSchema.optional(),
  consumida: z.boolean(),
});

// RF19 - Selecionar substituto (null volta ao alimento original)
const substituicaoSchema = z.object({
  substitutoId: z.string().uuid().nullable(),
});

module.exports = {
  OBJETIVOS,
  emailSchema,
  senhaSchema,
  dataSchema,
  horarioSchema,
  cadastrarNutricionistaSchema,
  atualizarNutricionistaSchema,
  loginSchema,
  solicitarRecuperacaoSenhaSchema,
  redefinirSenhaSchema,
  alterarSenhaSchema,
  cadastrarPacienteSchema,
  atualizarPacienteSchema,
  atualizarPerfilPacienteSchema,
  preferenciasSchema,
  planoAlimentarSchema,
  consultaSchema,
  atualizarConsultaSchema,
  evolucaoSchema,
  consumoSchema,
  substituicaoSchema,
};
