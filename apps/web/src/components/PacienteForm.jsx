import { useState } from 'react'
import { OBJETIVO_LABEL } from '@RoteiroNutri/shared'
import { Button, Field, Input, Select, Textarea } from './ui'

const VAZIO = {
  nome: '', email: '', telefone: '', idade: '', sexo: 'F', alturaCm: '', pesoInicialKg: '', pesoMetaKg: '',
  gorduraPct: '', massaMagraPct: '', objetivo: 'emagrecimento', alergias: '', historicoClinico: '',
}

/** Formulário de cadastro de paciente (RF04). */
export function PacienteForm({ onSubmit, onCancel, carregando }) {
  const [f, setF] = useState(VAZIO)
  const set = (campo) => (e) => setF({ ...f, [campo]: e.target.value })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(f)
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome completo *" className="sm:col-span-2">{(id) => <Input id={id} required value={f.nome} onChange={set('nome')} />}</Field>
        <Field label="E-mail (login do app) *">{(id) => <Input id={id} type="email" required value={f.email} onChange={set('email')} />}</Field>
        <Field label="Telefone">{(id) => <Input id={id} value={f.telefone} onChange={set('telefone')} placeholder="(41) 99999-0000" />}</Field>
        <Field label="Idade">{(id) => <Input id={id} type="number" min="1" value={f.idade} onChange={set('idade')} />}</Field>
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
        <Field label="Altura (cm)">{(id) => <Input id={id} type="number" step="0.1" value={f.alturaCm} onChange={set('alturaCm')} />}</Field>
        <Field label="Peso atual (kg)">{(id) => <Input id={id} type="number" step="0.1" value={f.pesoInicialKg} onChange={set('pesoInicialKg')} />}</Field>
        <Field label="Peso alvo (kg)">{(id) => <Input id={id} type="number" step="0.1" value={f.pesoMetaKg} onChange={set('pesoMetaKg')} />}</Field>
        <Field label="% Gordura corporal">{(id) => <Input id={id} type="number" step="0.1" value={f.gorduraPct} onChange={set('gorduraPct')} />}</Field>
        <Field label="% Massa magra">{(id) => <Input id={id} type="number" step="0.1" value={f.massaMagraPct} onChange={set('massaMagraPct')} />}</Field>
        <Field label="Alergias / intolerâncias" className="sm:col-span-2">
          {(id) => <Input id={id} value={f.alergias} onChange={set('alergias')} placeholder="Lactose, glúten..." />}
        </Field>
        <Field label="Histórico clínico" className="sm:col-span-2">
          {(id) => <Textarea id={id} value={f.historicoClinico} onChange={set('historicoClinico')} />}
        </Field>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Uma senha de acesso ao app será gerada automaticamente e enviada para o e-mail do paciente.
      </p>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={carregando}>
          Cadastrar paciente
        </Button>
      </div>
    </form>
  )
}
