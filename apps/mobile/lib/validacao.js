/**
 * Valida um formulário com um schema Zod do pacote compartilhado
 * (os mesmos schemas usados pela API). Retorna { dados } ou { erro }.
 */
export function validar(schema, valores) {
  const r = schema.safeParse(valores)
  return r.success ? { dados: r.data } : { erro: r.error.errors[0].message }
}
