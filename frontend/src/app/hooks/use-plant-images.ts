// hooks/use-plant-images.ts
"use client"

import { useState, useEffect, useCallback } from 'react'
import { PlantImage } from '@/components/plant-image-gallery'
import { fetchPlantImages, preloadImages, createImageLoader, getImageDebugInfo } from '../../utils/image-utils'

interface UseImageState {
  images: PlantImage[]
  loading: boolean
  error: string | null
  imageStates: Record<number, 'loading' | 'loaded' | 'error'>
  retryImage: (imageId: number) => void
  retryAll: () => void
  preloadAll: () => Promise<void>
}

/**
 * Hook personalizado para gerenciar imagens de plantas
 */
export function usePlantImages(plantId: number, initialImages?: PlantImage[]): UseImageState {
  const [images, setImages] = useState<PlantImage[]>(initialImages || [])
  const [loading, setLoading] = useState(!initialImages)
  const [error, setError] = useState<string | null>(null)
  const [imageStates, setImageStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({})
  
  // Criar um loader de imagens
  const imageLoader = createImageLoader()
  
  // Função para carregar imagens da API
  const loadImages = useCallback(async () => {
    if (initialImages && initialImages.length > 0) {
      console.log(`📸 Usando imagens fornecidas para planta ${plantId}:`, initialImages.length)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const fetchedImages = await fetchPlantImages(plantId)
      
      const processedImages: PlantImage[] = fetchedImages.map(img => ({
        id_imagem: img.id_imagem,
        nome_arquivo: img.nome_arquivo,
        ordem: img.ordem || 0,
        legenda: img.legenda || '',
        url: img.url,
        data_upload: img.data_upload
      }))
      
      setImages(processedImages)
      
      // Inicializar estados das imagens
      const initialStates: Record<number, 'loading' | 'loaded' | 'error'> = {}
      processedImages.forEach(img => {
        initialStates[img.id_imagem] = 'loading'
      })
      setImageStates(initialStates)
      
      console.log(`✅ ${processedImages.length} imagens carregadas para planta ${plantId}`)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar imagens'
      console.error(`❌ Erro ao carregar imagens da planta ${plantId}:`, err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [plantId, initialImages])
  
  // Carregar imagens no mount
  useEffect(() => {
    loadImages()
  }, [loadImages])
  
  // Inicializar estados se imagens foram fornecidas via props
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      const initialStates: Record<number, 'loading' | 'loaded' | 'error'> = {}
      initialImages.forEach(img => {
        initialStates[img.id_imagem] = 'loading'
      })
      setImageStates(initialStates)
    }
  }, [initialImages])
  
  // Função para atualizar o estado de uma imagem específica
  const updateImageState = useCallback((imageId: number, state: 'loading' | 'loaded' | 'error') => {
    setImageStates(prev => ({
      ...prev,
      [imageId]: state
    }))
  }, [])
  
  // Função para tentar recarregar uma imagem específica
  const retryImage = useCallback(async (imageId: number) => {
    const image = images.find(img => img.id_imagem === imageId)
    if (!image) return
    
    console.log(`🔄 Tentando recarregar imagem ${imageId}...`)
    
    updateImageState(imageId, 'loading')
    imageLoader.retry(image.url)
    
    try {
      const result = await imageLoader.loadImage(image.url)
      updateImageState(imageId, result.success ? 'loaded' : 'error')
      
      if (result.success) {
        console.log(`✅ Imagem ${imageId} recarregada com sucesso`)
      } else {
        console.error(`❌ Falha ao recarregar imagem ${imageId}:`, result.error)
      }
    } catch (err) {
      console.error(`❌ Erro ao tentar recarregar imagem ${imageId}:`, err)
      updateImageState(imageId, 'error')
    }
  }, [images, imageLoader, updateImageState])
  
  // Função para tentar recarregar todas as imagens
  const retryAll = useCallback(async () => {
    console.log(`🔄 Tentando recarregar todas as imagens da planta ${plantId}...`)
    
    // Resetar todos os estados para loading
    const loadingStates: Record<number, 'loading' | 'loaded' | 'error'> = {}
    images.forEach(img => {
      loadingStates[img.id_imagem] = 'loading'
      imageLoader.retry(img.url)
    })
    setImageStates(loadingStates)
    
    // Tentar carregar cada imagem
    for (const image of images) {
      try {
        const result = await imageLoader.loadImage(image.url)
        updateImageState(image.id_imagem, result.success ? 'loaded' : 'error')
      } catch (err) {
        console.error(`❌ Erro ao recarregar imagem ${image.id_imagem}:`, err)
        updateImageState(image.id_imagem, 'error')
      }
    }
  }, [images, plantId, imageLoader, updateImageState])
  
  // Função para pré-carregar todas as imagens
  const preloadAll = useCallback(async () => {
    if (images.length === 0) return
    
    console.log(`🔄 Pré-carregando ${images.length} imagens da planta ${plantId}...`)
    
    const urls = images.map(img => img.url)
    
    try {
      const results = await preloadImages(urls)
      
      results.forEach((result, index) => {
        const image = images[index]
        if (image) {
          updateImageState(image.id_imagem, result.success ? 'loaded' : 'error')
        }
      })
      
      const successCount = results.filter(r => r.success).length
      console.log(`✅ ${successCount}/${images.length} imagens pré-carregadas com sucesso`)
      
    } catch (err) {
      console.error('❌ Erro no pré-carregamento das imagens:', err)
    }
  }, [images, plantId, updateImageState])
  
  // Auto pré-carregamento quando as imagens mudam
  useEffect(() => {
    if (images.length > 0 && !loading) {
      // Delay para não sobrecarregar
      const timer = setTimeout(() => {
        preloadAll()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [images, loading, preloadAll])
  
  // Debug em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && images.length > 0) {
      console.group(`📸 Debug - Imagens da planta ${plantId}`)
      images.forEach(image => {
        console.log(`Imagem ${image.id_imagem}:`, getImageDebugInfo(image))
        console.log(`Estado: ${imageStates[image.id_imagem] || 'unknown'}`)
      })
      console.groupEnd()
    }
  }, [images, imageStates, plantId])
  
  return {
    images,
    loading,
    error,
    imageStates,
    retryImage,
    retryAll,
    preloadAll
  }
}

/**
 * Hook simplificado para usar apenas quando já se tem as imagens
 */
export function useImageStates(images: PlantImage[]) {
  const [imageStates, setImageStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({})
  
  // Inicializar estados
  useEffect(() => {
    const initialStates: Record<number, 'loading' | 'loaded' | 'error'> = {}
    images.forEach(img => {
      initialStates[img.id_imagem] = 'loading'
    })
    setImageStates(initialStates)
  }, [images])
  
  const updateImageState = useCallback((imageId: number, state: 'loading' | 'loaded' | 'error') => {
    setImageStates(prev => ({
      ...prev,
      [imageId]: state
    }))
  }, [])
  
  return {
    imageStates,
    updateImageState
  }
}