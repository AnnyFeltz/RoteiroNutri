import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

/**
 * Abre a galeria para o paciente escolher uma foto (recorte quadrado) e
 * devolve a imagem reduzida em base64 (data URL), pronta para enviar à API.
 * Retorna null se o usuário cancelar.
 */
export async function escolherFotoPerfil() {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permissao.granted) throw new Error('Permita o acesso às fotos para trocar a foto de perfil.')

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  })
  if (resultado.canceled || !resultado.assets?.length) return null

  // reduz para 256px: a foto fica leve para salvar no banco
  const imagem = await ImageManipulator.manipulate(resultado.assets[0].uri).resize({ width: 256 }).renderAsync()
  const salva = await imagem.saveAsync({ compress: 0.8, format: SaveFormat.JPEG, base64: true })
  return `data:image/jpeg;base64,${salva.base64}`
}
