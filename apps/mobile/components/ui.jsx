import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { cores, fonteTitulo, raio } from '../lib/tema'
import { iniciais } from '../lib/formato'

/** Tela com rolagem, área segura e "puxar para atualizar". */
export function Tela({ children, aoAtualizar, atualizando = false, contentStyle }) {
  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, contentStyle]}
        refreshControl={aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={cores.primaria} /> : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

export function Cabecalho({ titulo, subtitulo, voltar = true, direita }) {
  const router = useRouter()
  return (
    <View style={estilos.cabecalho}>
      {voltar ? (
        <Pressable hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityLabel="Voltar">
          <ArrowLeft size={22} color={cores.texto} />
        </Pressable>
      ) : (
        <View style={{ width: 22 }} />
      )}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Texto estilo="tituloPequeno">{titulo}</Texto>
        {subtitulo ? <Texto estilo="legenda">{subtitulo}</Texto> : null}
      </View>
      <View style={{ width: 22, alignItems: 'flex-end' }}>{direita}</View>
    </View>
  )
}

const ESTILOS_TEXTO = {
  titulo: { fontFamily: fonteTitulo, fontSize: 26, fontWeight: '600', color: cores.texto },
  tituloPequeno: { fontFamily: fonteTitulo, fontSize: 17, fontWeight: '600', color: cores.texto },
  numero: { fontFamily: fonteTitulo, fontSize: 18, fontWeight: '600', color: cores.texto },
  corpo: { fontSize: 14, color: cores.texto },
  forte: { fontSize: 14, fontWeight: '600', color: cores.texto },
  legenda: { fontSize: 12, color: cores.textoSuave },
  rotulo: { fontSize: 10, color: cores.textoSuave, textTransform: 'uppercase', letterSpacing: 1 },
}

export function Texto({ estilo = 'corpo', style, ...props }) {
  return <Text style={[ESTILOS_TEXTO[estilo], style]} {...props} />
}

export function Card({ style, children, ...props }) {
  return (
    <View style={[estilos.card, style]} {...props}>
      {children}
    </View>
  )
}

/** Card com o degradê verde do protótipo. */
export function CardDestaque({ style, children, de = cores.primaria, para = cores.folhaEscura }) {
  return (
    <LinearGradient colors={[de, para]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[estilos.card, { borderWidth: 0 }, style]}>
      {children}
    </LinearGradient>
  )
}

export function Botao({ titulo, onPress, variante = 'primario', carregando, desabilitado, icone, style }) {
  const v = VARIANTES[variante]
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado || carregando}
      style={({ pressed }) => [estilos.botao, v.caixa, (desabilitado || carregando) && { opacity: 0.6 }, pressed && { opacity: 0.85 }, style]}
    >
      {carregando ? <ActivityIndicator color={v.texto.color} /> : icone}
      <Text style={[estilos.botaoTexto, v.texto]}>{titulo}</Text>
    </Pressable>
  )
}

const VARIANTES = {
  primario: { caixa: { backgroundColor: cores.primaria }, texto: { color: cores.primariaTexto } },
  contorno: { caixa: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.borda }, texto: { color: cores.texto } },
  claro: { caixa: { backgroundColor: cores.branco }, texto: { color: cores.primaria } },
  translucido: { caixa: { backgroundColor: 'rgba(255,255,255,0.18)' }, texto: { color: cores.primariaTexto } },
  perigo: { caixa: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.borda }, texto: { color: cores.perigo } },
}

export function Campo({ rotulo, style, ...props }) {
  return (
    <View style={style}>
      {rotulo ? <Texto estilo="forte" style={{ marginBottom: 6, fontSize: 13 }}>{rotulo}</Texto> : null}
      <TextInput placeholderTextColor={cores.textoSuave} style={estilos.input} {...props} />
    </View>
  )
}

export function Selo({ texto, cor = cores.primaria, fundo = 'rgba(46,89,41,0.12)', style }) {
  return (
    <View style={[{ backgroundColor: fundo, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }, style]}>
      <Text style={{ color: cor, fontSize: 11, fontWeight: '600' }}>{texto}</Text>
    </View>
  )
}

export function Avatar({ nome, cor = cores.primaria, tamanho = 44 }) {
  return (
    <View style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cor, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: cores.branco, fontWeight: '700', fontSize: tamanho * 0.36, fontFamily: fonteTitulo }}>{iniciais(nome)}</Text>
    </View>
  )
}

export function BarraProgresso({ pct, cor = cores.primaria, altura = 6, fundo = cores.suave }) {
  return (
    <View style={{ height: altura, borderRadius: altura, backgroundColor: fundo, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: cor, borderRadius: altura }} />
    </View>
  )
}

export function Carregando() {
  return (
    <SafeAreaView style={[estilos.tela, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={cores.primaria} />
    </SafeAreaView>
  )
}

export function Erro({ erro, onTentar }) {
  return (
    <SafeAreaView style={[estilos.tela, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <Texto estilo="tituloPequeno">Não foi possível carregar</Texto>
      <Texto estilo="legenda" style={{ textAlign: 'center', marginTop: 6 }}>
        {erro?.message}
      </Texto>
      {onTentar && <Botao titulo="Tentar novamente" variante="contorno" onPress={onTentar} style={{ marginTop: 16 }} />}
    </SafeAreaView>
  )
}

export const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.creme },
  conteudo: { padding: 20, paddingBottom: 32, gap: 14 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  card: { backgroundColor: cores.card, borderRadius: raio, borderWidth: 1, borderColor: cores.borda, padding: 16 },
  botao: { minHeight: 46, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  botaoTexto: { fontSize: 15, fontWeight: '600' },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.card,
    paddingHorizontal: 14,
    fontSize: 15,
    color: cores.texto,
  },
  linha: { flexDirection: 'row', alignItems: 'center' },
})
