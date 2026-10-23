import { toast } from 'sonner'

/**
 * Valida os dados de um formulário com um schema Zod do pacote compartilhado
 * (os mesmos schemas que a API usa). Retorna os dados já tratados ou null,
 * preenchendo `setErros` com { campo: mensagem } e avisando o primeiro erro.
 */
export function validar(schema, dados, setErros) {
  const resultado = schema.safeParse(dados)
  if (resultado.success) {
    setErros?.({})
    return resultado.data
  }
  const erros = {}
  for (const e of resultado.error.errors) {
    const campo = e.path.join('.')
    if (!erros[campo]) erros[campo] = e.message
  }
  setErros?.(erros)
  toast.error(resultado.error.errors[0].message)
  return null
}
