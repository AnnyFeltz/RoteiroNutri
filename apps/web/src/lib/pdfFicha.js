import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { imc, classificacaoImc, calcularAlimento, totaisRefeicao } from '@RoteiroNutri/shared'
import { dataBR, dataHoraBR, objetivoLabel, sinal } from './format'

const PRIMARIA = [76, 124, 89]
const TINTA = [24, 24, 27]
const SUAVE = [110, 110, 115]
const LINHA = [210, 210, 215]

// RF15 - Ficha médica/nutricional + plano alimentar em PDF profissional
export function exportarFichaPDF(p, plano, nutri) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const larg = doc.internal.pageSize.getWidth()
  const alt = doc.internal.pageSize.getHeight()
  const margem = 48
  let y = margem

  const emitidoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // ---------- Cabeçalho ----------
  doc.setFillColor(...PRIMARIA)
  doc.rect(margem, y, 4, 44, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...PRIMARIA)
  doc.text('ROTEIRO NUTRI', margem + 14, y + 14)
  doc.setFontSize(18)
  doc.setTextColor(...TINTA)
  doc.text('Ficha Médica/Nutricional', margem + 14, y + 32)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SUAVE)
  doc.text('Documento de acompanhamento clínico-nutricional', margem + 14, y + 44)

  doc.setTextColor(...TINTA)
  doc.setFont('helvetica', 'bold')
  doc.text(nutri.nome, larg - margem, y + 14, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...SUAVE)
  doc.text(nutri.crn, larg - margem, y + 26, { align: 'right' })
  doc.text(`Emitido em ${emitidoEm}`, larg - margem, y + 38, { align: 'right' })
  doc.setFontSize(8)
  doc.text(`Prontuário #${p.id.slice(0, 8).toUpperCase()}`, larg - margem, y + 48, { align: 'right' })

  y += 60
  doc.setDrawColor(...TINTA)
  doc.setLineWidth(1.2)
  doc.line(margem, y, larg - margem, y)
  y += 18

  // ---------- Auxiliares ----------
  const garantir = (h) => {
    if (y + h > alt - margem - 30) {
      doc.addPage()
      y = margem
    }
  }

  const titulo = (n, t) => {
    garantir(28)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...PRIMARIA)
    doc.text(`${n}. ${t}`, margem, y)
    y += 6
    doc.setDrawColor(...PRIMARIA)
    doc.setLineWidth(0.6)
    doc.line(margem, y, margem + 40, y)
    y += 14
    doc.setTextColor(...TINTA)
  }

  const grade = (linhas) => {
    const colW = (larg - margem * 2) / 2
    doc.setFontSize(9)
    linhas.forEach(([rotulo, valor], i) => {
      if (i % 2 === 0) garantir(18)
      const x = margem + (i % 2) * colW
      const yy = y + Math.floor(i / 2) * 16
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...SUAVE)
      doc.text(rotulo, x, yy)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...TINTA)
      doc.text(String(valor ?? '—'), x + 110, yy, { maxWidth: colW - 115 })
    })
    y += Math.ceil(linhas.length / 2) * 16 + 6
  }

  const bloco = (rotulo, texto) => {
    const linhas = doc.splitTextToSize(texto || 'Não informado.', larg - margem * 2)
    garantir(14 + linhas.length * 12)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...SUAVE)
    doc.text(rotulo.toUpperCase(), margem, y)
    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...TINTA)
    doc.text(linhas, margem, y)
    y += linhas.length * 12 + 6
  }

  const tabela = (opcoes) => {
    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: TINTA },
      headStyles: { fillColor: PRIMARIA, textColor: 255, fontStyle: 'bold' },
      theme: 'grid',
      ...opcoes,
    })
    y = doc.lastAutoTable.finalY + 14
  }

  const vazio = (texto) => {
    doc.setFontSize(9)
    doc.setTextColor(...SUAVE)
    doc.setFont('helvetica', 'italic')
    doc.text(texto, margem, y)
    y += 16
  }

  const valorImc = imc(p.pesoAtualKg, p.alturaCm)
  const inicial = p.pesoInicialKg ?? p.evolucao[0]?.pesoKg
  const delta = p.pesoAtualKg != null && inicial != null ? p.pesoAtualKg - inicial : null
  const kg = (v) => (v == null ? '—' : `${v} kg`)

  // ---------- 1. Identificação ----------
  titulo(1, 'Identificação do paciente')
  grade([
    ['Nome completo', p.nome],
    ['E-mail', p.email],
    ['Idade', p.idade ? `${p.idade} anos` : '—'],
    ['Sexo', p.sexo === 'F' ? 'Feminino' : p.sexo === 'M' ? 'Masculino' : '—'],
    ['Início do acompanhamento', dataBR(p.dataInicio)],
    ['Última consulta', p.ultimaConsulta ? dataBR(p.ultimaConsulta.data) : '—'],
    ['Próxima consulta', p.proximaConsulta ? `${dataBR(p.proximaConsulta.data)} ${p.proximaConsulta.horario}` : '—'],
    ['Status', p.ativo ? 'Em acompanhamento' : 'Inativo'],
  ])

  // ---------- 2. Anamnese ----------
  titulo(2, 'Anamnese clínica')
  bloco('Histórico médico', p.historicoClinico)
  bloco('Alergias e intolerâncias', p.alergias || 'Nenhuma relatada.')
  bloco('Estilo de vida e rotina', p.estiloVida)
  bloco('Recordatório alimentar (24h)', p.recordatorioAlimentar)

  // ---------- 3. Antropometria ----------
  titulo(3, 'Avaliação antropométrica')
  grade([
    ['Altura', p.alturaCm ? `${p.alturaCm} cm` : '—'],
    ['Peso atual', kg(p.pesoAtualKg)],
    ['Peso inicial', kg(inicial)],
    ['Peso alvo', kg(p.pesoMetaKg)],
    ['IMC', valorImc ? `${valorImc.toFixed(1)} (${classificacaoImc(valorImc)})` : '—'],
    ['Variação', delta != null ? `${sinal(delta)} kg` : '—'],
    ['% Gordura corporal', p.gorduraPct != null ? `${p.gorduraPct}%` : '—'],
    ['% Massa magra', p.massaMagraPct != null ? `${p.massaMagraPct}%` : '—'],
    ['Objetivo', objetivoLabel(p.objetivo)],
  ])

  // ---------- 4. Evolução ----------
  titulo(4, 'Evolução do peso')
  if (p.evolucao.length === 0) vazio('Nenhuma pesagem registrada.')
  else {
    tabela({
      head: [['Data', 'Peso (kg)', 'Δ vs início', '% Gordura', '% Massa magra']],
      body: p.evolucao.map((e) => [
        dataBR(e.data),
        e.pesoKg.toFixed(1),
        inicial != null ? `${sinal(e.pesoKg - inicial)} kg` : '—',
        e.gorduraPct ?? '—',
        e.massaMagraPct ?? '—',
      ]),
      alternateRowStyles: { fillColor: [248, 248, 245] },
    })
  }

  // ---------- 5. Plano alimentar ----------
  titulo(5, 'Plano alimentar vigente')
  if (!plano) vazio('Nenhum plano alimentar cadastrado.')
  else {
    grade([
      ['Plano', `${plano.nome} (versão ${plano.versao})`],
      ['Criado em', dataHoraBR(plano.createdAt)],
      ['Status', plano.ativo ? 'Ativo' : 'Suspenso/encerrado'],
      ['Meta calórica', `${plano.kcalAlvo} kcal/dia`],
      ['Carboidratos', `${plano.pctCarbo}%`],
      ['Proteínas', `${plano.pctProteina}%`],
      ['Gorduras', `${plano.pctGordura}%`],
      ['Total de refeições', String(plano.refeicoes.length)],
    ])
    plano.refeicoes.forEach((r) => {
      garantir(40)
      tabela({
        head: [[`${r.nome} — ${r.horario}`, 'Quantidade', 'Energia', `Total: ${totaisRefeicao(r).kcal} kcal`]],
        body: r.itens.map((item) => {
          const c = calcularAlimento(item.alimento, item.gramas)
          const subs = item.substitutos.length ? `\nSubstitutos: ${item.substitutos.map((s) => `${s.alimento.nome} (${s.gramas} g)`).join('; ')}` : ''
          return [`${item.alimento.nome}${subs}`, `${item.gramas} g`, `${c.kcal} kcal`, `P ${c.proteina} · C ${c.carbo} · G ${c.gordura}`]
        }),
        styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 4, textColor: TINTA },
        headStyles: { fillColor: [240, 244, 238], textColor: PRIMARIA, fontStyle: 'bold', halign: 'left' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', textColor: SUAVE } },
      })
    })
  }

  // ---------- 6. Atendimentos ----------
  titulo(6, 'Histórico de atendimentos')
  if (p.consultas.length === 0) vazio('Sem atendimentos registrados.')
  else {
    tabela({
      head: [['Data', 'Horário', 'Tipo', 'Notas']],
      body: p.consultas.map((c) => [dataBR(c.data), c.horario, c.tipo, c.observacoes || '—']),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: TINTA, valign: 'top' },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 55 }, 2: { cellWidth: 80 } },
    })
  }

  // ---------- 7. Conduta ----------
  titulo(7, 'Conduta e observações')
  const conduta =
    `Paciente em acompanhamento com objetivo de ${objetivoLabel(p.objetivo).toLowerCase()}. ` +
    (delta != null ? `Variação total de ${sinal(delta)} kg desde o início do acompanhamento. ` : '') +
    `Manter conduta nutricional vigente e reavaliação na próxima consulta${p.proximaConsulta ? ` (${dataBR(p.proximaConsulta.data)})` : ''}.`
  const linhas = doc.splitTextToSize(conduta, larg - margem * 2)
  garantir(linhas.length * 12 + 80)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...TINTA)
  doc.text(linhas, margem, y)
  y += linhas.length * 12 + 40

  // Assinatura
  doc.setDrawColor(...TINTA)
  doc.setLineWidth(0.6)
  const xAss = larg - margem - 220
  doc.line(xAss, y, larg - margem, y)
  y += 12
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(nutri.nome, xAss + 110, y, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...SUAVE)
  doc.setFontSize(8)
  doc.text(nutri.crn, xAss + 110, y + 11, { align: 'center' })

  // Rodapé em todas as páginas
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const fy = alt - margem + 8
    doc.setDrawColor(...LINHA)
    doc.setLineWidth(0.5)
    doc.line(margem, fy - 14, larg - margem, fy - 14)
    doc.setFontSize(7.5)
    doc.setTextColor(...SUAVE)
    doc.setFont('helvetica', 'normal')
    doc.text('Documento gerado eletronicamente pelo Roteiro Nutri · Informação sigilosa LGPD Art. 11', margem, fy)
    doc.text(`Página ${i} de ${total}`, larg - margem, fy, { align: 'right' })
  }

  const arquivo = `ficha-${p.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(arquivo)
}
