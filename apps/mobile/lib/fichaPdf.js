import { Platform } from 'react-native'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { imc, classificacaoImc, calcularAlimento, totaisRefeicao } from '@RoteiroNutri/shared'
import { dataBR, objetivoLabel, num, sinal } from './formato'

// RF15 - Versão do paciente da ficha médica/nutricional (a mesma que o nutricionista exporta na web)
const esc = (v) =>
  String(v ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const kv = (k, v) => `<div class="kv"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`
const bloco = (k, v) => `<div class="bloco"><span>${esc(k)}</span><p>${esc(v)}</p></div>`
const secao = (titulo, conteudo) => `<section><h2>${esc(titulo)}</h2>${conteudo}</section>`

function montarHtml({ perfil: p, plano, evolucao, consultas }) {
  const valorImc = imc(p.pesoAtualKg, p.alturaCm)
  const registros = evolucao?.registros ?? []
  const inicial = p.pesoInicialKg ?? registros[0]?.pesoKg
  const delta = p.pesoAtualKg != null && inicial != null ? p.pesoAtualKg - inicial : null
  const emitidoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const n = p.nutricionista

  const identificacao = `<div class="grade">
    ${kv('Nome completo', p.nome)}
    ${kv('E-mail', p.email)}
    ${kv('Telefone', p.telefone || '—')}
    ${kv('Idade', p.idade ? `${p.idade} anos` : '—')}
    ${kv('Sexo', p.sexo === 'F' ? 'Feminino' : p.sexo === 'M' ? 'Masculino' : '—')}
    ${kv('Início do acompanhamento', dataBR(p.dataInicio))}
    ${kv('Nutricionista', n ? `${n.nome} (${n.crn})` : '—')}
    ${kv('Próxima consulta', p.proximaConsulta ? `${dataBR(p.proximaConsulta.data)} · ${p.proximaConsulta.horario}` : '—')}
  </div>`

  const anamnese =
    bloco('Histórico médico', p.historicoClinico || 'Não informado.') +
    bloco('Alergias e intolerâncias', p.alergias || 'Nenhuma relatada.') +
    bloco('Estilo de vida e rotina', p.estiloVida || 'Não informado.') +
    bloco('Recordatório alimentar (últimas 24h)', p.recordatorioAlimentar || 'Não informado.')

  const avaliacao = `<div class="grade grade-3">
    ${kv('Altura', p.alturaCm ? `${p.alturaCm} cm` : '—')}
    ${kv('Peso atual', p.pesoAtualKg != null ? `${num(p.pesoAtualKg)} kg` : '—')}
    ${kv('Peso inicial', inicial != null ? `${num(inicial)} kg` : '—')}
    ${kv('Peso alvo', p.pesoMetaKg != null ? `${num(p.pesoMetaKg)} kg` : '—')}
    ${kv('IMC', valorImc ? `${valorImc.toFixed(1)} (${classificacaoImc(valorImc)})` : '—')}
    ${kv('Variação', delta != null ? `${sinal(delta)} kg` : '—')}
    ${kv('% Gordura corporal', p.gorduraPct != null ? `${p.gorduraPct}%` : '—')}
    ${kv('% Massa magra', p.massaMagraPct != null ? `${p.massaMagraPct}%` : '—')}
    ${kv('Objetivo', objetivoLabel(p.objetivo))}
  </div>`

  const tabelaEvolucao = registros.length
    ? `<table><thead><tr><th>Data</th><th>Peso</th><th>% Gordura</th><th>% Massa magra</th></tr></thead><tbody>${registros
        .map(
          (r) =>
            `<tr><td>${dataBR(r.data)}</td><td>${num(r.pesoKg)} kg</td><td>${r.gorduraPct != null ? `${r.gorduraPct}%` : '—'}</td><td>${
              r.massaMagraPct != null ? `${r.massaMagraPct}%` : '—'
            }</td></tr>`
        )
        .join('')}</tbody></table>`
    : '<p class="vazio">Nenhuma pesagem registrada.</p>'

  let planoHtml = '<p class="vazio">Nenhum plano alimentar ativo.</p>'
  if (plano) {
    planoHtml =
      `<p class="resumo">${esc(plano.nome)} · v${plano.versao} · meta de ${plano.kcalAlvo} kcal · ` +
      `Carboidratos ${plano.pctCarbo}% · Proteínas ${plano.pctProteina}% · Gorduras ${plano.pctGordura}%</p>` +
      plano.refeicoes
        .map((r) => {
          const tot = totaisRefeicao(r)
          const itens = r.itens
            .map((item) => {
              const c = calcularAlimento(item.alimento, item.gramas)
              const subs = item.substitutos?.length
                ? `<div class="subs">Pode trocar por: ${item.substitutos.map((s) => `${esc(s.alimento.nome)} (${s.gramas} g)`).join(' · ')}</div>`
                : ''
              return `<tr><td>${esc(item.alimento.nome)}${subs}</td><td>${item.gramas} g</td><td>${c.kcal} kcal</td></tr>`
            })
            .join('')
          return `<div class="refeicao"><h3>${esc(r.nome)} <small>${esc(String(r.horario).slice(0, 5))} · ${tot.kcal} kcal</small></h3>
            <table><thead><tr><th>Alimento</th><th>Quantidade</th><th>Energia</th></tr></thead><tbody>${itens}</tbody></table></div>`
        })
        .join('')
  }

  const todasConsultas = [...(consultas?.proximas ?? []), ...(consultas?.anteriores ?? [])]
  const tabelaConsultas = todasConsultas.length
    ? `<table><thead><tr><th>Data</th><th>Horário</th><th>Tipo</th></tr></thead><tbody>${todasConsultas
        .map((c) => `<tr><td>${dataBR(c.data)}</td><td>${esc(String(c.horario).slice(0, 5))}</td><td>${esc(c.tipo)}</td></tr>`)
        .join('')}</tbody></table>`
    : '<p class="vazio">Nenhuma consulta registrada.</p>'

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: Helvetica, Arial, sans-serif; color: #18181b; margin: 32px; font-size: 11px; }
    header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #18181b; padding-bottom: 10px; margin-bottom: 16px; }
    .marca { color: #4c7c59; font-weight: bold; letter-spacing: 1px; font-size: 9px; }
    h1 { font-size: 20px; margin: 4px 0 2px; }
    .legenda, .emissor { color: #6e6e73; font-size: 9px; }
    .emissor { text-align: right; }
    section { margin-bottom: 16px; page-break-inside: avoid; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #4c7c59; border-bottom: 1px solid #d2d2d7; padding-bottom: 4px; }
    h3 { font-size: 12px; margin: 10px 0 4px; }
    h3 small { color: #6e6e73; font-weight: normal; }
    .grade { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
    .grade-3 { grid-template-columns: 1fr 1fr 1fr; }
    .kv span, .bloco span { display: block; color: #6e6e73; font-size: 9px; }
    .bloco { margin-bottom: 8px; }
    .bloco p { margin: 2px 0 0; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #e5e5ea; vertical-align: top; }
    th { color: #6e6e73; font-weight: normal; font-size: 9px; }
    .subs { color: #6e6e73; font-size: 9px; margin-top: 2px; }
    .resumo { margin: 4px 0 8px; }
    .vazio { color: #6e6e73; font-style: italic; }
    footer { margin-top: 24px; color: #6e6e73; font-size: 8px; text-align: center; }
  </style></head><body>
  <header>
    <div><div class="marca">ROTEIRO NUTRI</div><h1>Ficha Médica/Nutricional</h1><div class="legenda">Cópia do paciente · documento de acompanhamento clínico-nutricional</div></div>
    <div class="emissor">${n ? `<strong>${esc(n.nome)}</strong><br />${esc(n.crn)}<br />` : ''}Emitido em ${esc(emitidoEm)}</div>
  </header>
  ${secao('1. Identificação', identificacao)}
  ${secao('2. Anamnese clínica', anamnese)}
  ${secao('3. Avaliação antropométrica', avaliacao)}
  ${secao('4. Evolução do peso', tabelaEvolucao)}
  ${secao('5. Plano alimentar ativo', planoHtml)}
  ${secao('6. Consultas', tabelaConsultas)}
  <footer>Documento gerado pelo app Roteiro Nutri. Os dados clínicos são de responsabilidade do nutricionista.</footer>
  </body></html>`
}

/** Gera a ficha em PDF e abre o compartilhamento (salvar, enviar por WhatsApp, e-mail...). */
export async function exportarFichaPaciente(dados) {
  const html = montarHtml(dados)
  if (Platform.OS === 'web') {
    // no navegador o expo-print imprime a própria página; abrimos a ficha numa janela
    // e chamamos a impressão dela (dá para escolher "Salvar como PDF")
    const janela = window.open('', '_blank')
    if (!janela) throw new Error('Permita pop-ups para gerar o PDF.')
    janela.document.write(html)
    janela.document.close()
    janela.focus()
    setTimeout(() => janela.print(), 300)
    return
  }
  const { uri } = await Print.printToFileAsync({ html })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Minha ficha nutricional' })
  } else {
    await Print.printAsync({ uri })
  }
}
