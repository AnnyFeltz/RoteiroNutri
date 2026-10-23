/**
 * Lê uma imagem escolhida pelo usuário e devolve uma versão quadrada e
 * reduzida (JPEG em base64), pronta para salvar como foto de perfil.
 */
export function reduzirImagem(arquivo, tamanho = 256) {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith('image/')) return reject(new Error('Escolha um arquivo de imagem'))
    const leitor = new FileReader()
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem'))
    leitor.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagem inválida'))
      img.onload = () => {
        // recorta o centro em quadrado e redimensiona
        const lado = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = tamanho
        canvas.height = tamanho
        canvas
          .getContext('2d')
          .drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, tamanho, tamanho)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = leitor.result
    }
    leitor.readAsDataURL(arquivo)
  })
}
