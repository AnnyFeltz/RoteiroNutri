import { useState } from 'react'
import { OBJETIVO_LABEL, cadastrarPacienteSchema } from '@RoteiroNutri/shared'
import { Button, Field, Input, Select, Textarea } from './ui'
import { validar } from '../lib/validacao'

const VAZIO = {
  nome: '', email: '', telefone: '', idade: '', sexo: 'F', alturaCm: '', pesoInicialKg: '', pesoMetaKg: '',
  gorduraPct: '', massaMagraPct: '', objetivo: 'emagrecimento', alergias: '', historicoClinico: '',
}

/** Formulário de cadastro de paciente (RF04), validado com Zod. */
export function PacienteForm({ onSubmit, onCancel, carregando }) {
  const [f, setF] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const set = (campo) => (e) => setF({ ...f, [campo]: e.target.value })

  const enviar = (e) => {
    e.preventDefault()
    const dados = validar(cadastrarPacienteSchema, f, setErros)
    if (dados) onSubmit(dados)
  }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="grade grade-2-sm">
        <Field label="Nome completo *" className="ocupa-tudo" erro={erros.nome}>
          {(id) => <Input id={id} value={f.nome} onChange={set('nome')} erro={erros.nome} />}
        </Field>
        <Field label="E-mail (login do app) *" erro={erros.email}>
          {(id) => <Input id={id} type="email" value={f.email} onChange={set('email')} erro={erros.email} />}
        </Field>
        <Field label="Telefone">{(id) => <Input id={id} value={f.telefone} onChange={set('telefone')} placeholder="(41) 99999-0000" />}</Field>
        <Field label="Idade" erro={erros.idade}>
          {(id) => <Input id={id} type="number" min="1" value={f.idade} onChange={set('idade')} erro={erros.idade} />}
        </Field>
        <Field label="Sexo">
          {(id) => (
            <Select id={id} value={f.sexo} onChange={set('sexo')}>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
            </Select>
          )}
        </Field>
        <Field label="Objetivo">
          {(id) => (
            <Select id={id} value={f.objetivo} onChange={set('objetivo')}>
              {Object.entries(OBJETIVO_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Altura (cm)" erro={erros.alturaCm}>
          {(id) => <Input id={id} type="number" step="0.1" value={f.alturaCm} onChange={set('alturaCm')} erro={erros.alturaCm} />}
        </Field>
        <Field label="Peso atual (kg)" erro={erros.pesoInicialKg}>
          {(id) => <Input id={id} type="number" step="0.1" value={f.pesoInicialKg} onChange={set('pesoInicialKg')} erro={erros.pesoInicialKg} />}
        </Field>
        <Field label="Peso alvo (kg)" erro={erros.pesoMetaKg}>
          {(id) => <Input id={id} type="number" step="0.1" value={f.pesoMetaKg} onChange={set('pesoMetaKg')} erro={erros.pesoMetaKg} />}
        </Field>
        <Field label="% Gordura corporal" erro={erros.gorduraPct}>
          {(id) => <Input id={id} type="number" step="0.1" value={f.gorduraPct} onChange={set('gorduraPct')} erro={erros.gorduraPct} />}
        </Field>
        <Field label="% Massa magra" erro={erros.massaMagraPct}>
          {(id) => <Input id={id} type="number" step="0.1" value={f.massaMagraPct} onChange={set('massaMagraPct')} erro={erros.massaMagraPct} />}
        </Field>
        <Field label="Alergias / intolerâncias" className="ocupa-tudo">
          {(id) => <Input id={id} value={f.alergias} onChange={set('alergias')} placeholder="Lactose, glúten..." />}
        </Field>
        <Field label="Histórico clínico" className="ocupa-tudo">
          {(id) => <Textarea id={id} value={f.historicoClinico} onChange={set('historicoClinico')} />}
        </Field>
      </div>
      <p className="dica" style={{ marginTop: 16 }}>
        Uma senha de acesso ao app será gerada automaticamente e enviada para o e-mail do paciente.
      </p>
      <div className="modal-rodape">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={carregando}>
          Cadastrar paciente
        </Button>
      </div>
    </form>
  )
}
