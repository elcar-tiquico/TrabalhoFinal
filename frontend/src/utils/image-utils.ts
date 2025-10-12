// utils/image-utils.ts

/**
 * Utilitários para trabalhar com imagens das plantas
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface ImageLoadResult {
  success: boolean
  url: string
  error?: string
}

/**
 * Processa e valida URLs de imagens
 */
export function processImageUrl(url: string, plantaId: number): string {
  if (!url) return ''
  
  // Se já é uma URL completa, retornar como está
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Se é um caminho relativo, construir URL completa
  if (url.startsWith('/uploads/')) {
    return `${API_BASE_URL}${url}`
  }
  
  // Se é apenas o nome do arquivo, construir caminho completo
  if (!url.startsWith('/')) {
    return `${API_BASE_URL}/uploads/plantas_imagens/${plantaId}/${url}`
  }
  
  // Fallback
  return `${API_BASE_URL}${url}`
}

/**
 * Pré-carrega uma imagem e retorna uma Promise
 */
export function preloadImage(url: string): Promise<ImageLoadResult> {
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        success: true,
        url: url
      })
    }
    
    img.onerror = () => {
      resolve({
        success: false,
        url: url,
        error: 'Falha ao carregar imagem'
      })
    }
    
    // Timeout após 10 segundos
    setTimeout(() => {
      resolve({
        success: false,
        url: url,
        error: 'Timeout ao carregar imagem'
      })
    }, 10000)
    
    img.src = url
  })
}

/**
 * Pré-carrega múltiplas imagens em paralelo
 */
export async function preloadImages(urls: string[]): Promise<ImageLoadResult[]> {
  const promises = urls.map(url => preloadImage(url))
  return Promise.all(promises)
}

/**
 * Busca imagens de uma planta específica da API
 */
export async function fetchPlantImages(plantId: number): Promise<any[]> {
  try {
    console.log(`🔄 Buscando imagens para planta ${plantId}...`)
    
    const response = await fetch(`${API_BASE_URL}/api/plantas/${plantId}/imagens`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('📸 Resposta da API de imagens:', data)
    
    const images = data.imagens || []
    
    // Processar URLs das imagens
    const processedImages = images.map((img: any) => ({
      ...img,
      url: processImageUrl(img.url, plantId),
      legenda: img.legenda || ''
    }))
    
    // Ordenar por ordem
    processedImages.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
    
    console.log(`✅ ${processedImages.length} imagens processadas para planta ${plantId}`)
    
    return processedImages
    
  } catch (error) {
    console.error(`❌ Erro ao buscar imagens da planta ${plantId}:`, error)
    throw error
  }
}

/**
 * Gera uma URL de placeholder para quando a imagem falha
 */
export function getPlaceholderImageUrl(width: number = 400, height: number = 300): string {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#666" text-anchor="middle" dy=".3em">
        Imagem não disponível
      </text>
    </svg>
  `)}`
}

/**
 * Hook personalizado para carregar imagens com retry
 */
export function createImageLoader() {
  const loadedImages = new Set<string>()
  const failedImages = new Set<string>()
  
  return {
    async loadImage(url: string, maxRetries: number = 2): Promise<ImageLoadResult> {
      if (loadedImages.has(url)) {
        return { success: true, url }
      }
      
      if (failedImages.has(url)) {
        return { success: false, url, error: 'Falha anterior' }
      }
      
      let lastError = ''
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await preloadImage(url)
          
          if (result.success) {
            loadedImages.add(url)
            return result
          } else {
            lastError = result.error || 'Erro desconhecido'
          }
          
          // Esperar antes de tentar novamente
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          }
          
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
      
      failedImages.add(url)
      return { success: false, url, error: lastError }
    },
    
    isLoaded(url: string): boolean {
      return loadedImages.has(url)
    },
    
    hasFailed(url: string): boolean {
      return failedImages.has(url)
    },
    
    retry(url: string): void {
      failedImages.delete(url)
      loadedImages.delete(url)
    }
  }
}

/**
 * Verifica se uma URL de imagem é válida
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Extrai informações de debug de uma imagem
 */
export function getImageDebugInfo(image: any): object {
  return {
    id: image.id_imagem,
    nome_arquivo: image.nome_arquivo,
    url: image.url,
    url_valida: isValidImageUrl(image.url),
    ordem: image.ordem,
    tem_legenda: !!image.legenda,
    data_upload: image.data_upload
  }
}