"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './plant-image-gallery.module.css'

export interface PlantImage {
  id_imagem: number
  nome_arquivo: string
  ordem: number
  legenda?: string
  url: string
  data_upload?: string
}

interface PlantImageGalleryProps {
  images?: PlantImage[]
  plantId?: number
  plantName?: string
  className?: string
}

export default function PlantImageGallery({ 
  images: initialImages, 
  plantId, 
  plantName,
  className 
}: PlantImageGalleryProps) {
  const [images, setImages] = useState<PlantImage[]>(initialImages || [])
  const [loading, setLoading] = useState(!initialImages && !!plantId)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  
  useEffect(() => {
    if (!initialImages && plantId) {
      loadImages()
    }
  }, [plantId, initialImages])
  
  const loadImages = async () => {
    if (!plantId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/api/plantas/${plantId}/imagens`)
      if (!response.ok) throw new Error(`Erro ${response.status}`)
      
      const data = await response.json()
      const processedImages: PlantImage[] = (data.imagens || []).map((img: any) => ({
        id_imagem: img.id_imagem,
        nome_arquivo: img.nome_arquivo,
        ordem: img.ordem || 0,
        legenda: img.legenda || '',
        url: img.url,
        data_upload: img.data_upload
      }))
      
      processedImages.sort((a, b) => a.ordem - b.ordem)
      setImages(processedImages)
      
    } catch (err) {
      setError('Erro ao carregar imagens')
      setImages([])
    } finally {
      setLoading(false)
    }
  }
  
  const openModal = () => {
    setCurrentIndex(0)
    setShowModal(true)
    document.body.classList.add('modal-open')
  }
  
  const closeModal = () => {
    setShowModal(false)
    document.body.classList.remove('modal-open')
  }
  
  const nextImage = () => {
    setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
  }
  
  const prevImage = () => {
    setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }
  
  useEffect(() => {
    if (!showModal) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.body.classList.remove('modal-open')
    }
  }, [showModal])
  
  if (loading) {
    return (
      <div className={`${styles.gallery} ${className || ''}`}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Carregando imagens...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={`${styles.gallery} ${className || ''}`}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p className={styles.errorText}>{error}</p>
          <button onClick={loadImages} className={styles.retryButton}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }
  
  if (images.length === 0) {
    return (
      <div className={`${styles.gallery} ${className || ''}`}>
        <div className={styles.emptyState}>
          <div className={styles.placeholderImage}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </div>
          <p className={styles.emptyText}>Sem imagens disponíveis</p>
        </div>
      </div>
    )
  }
  
  const firstImage = images[0]
  
  const renderModal = () => {
    if (!showModal || typeof window === 'undefined') return null
    
    const currentImage = images[currentIndex]
    
    return createPortal(
      <div className={styles.modal} onClick={closeModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {/* Botão fechar */}
          <button 
            onClick={closeModal}
            className={styles.closeButton}
            aria-label="Fechar modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          {/* Navegação anterior */}
          {images.length > 1 && (
            <button 
              onClick={prevImage}
              className={`${styles.navButton} ${styles.navPrev}`}
              aria-label="Imagem anterior"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>
          )}
          
          {/* Container da imagem */}
          <div className={styles.modalImageContainer}>
            <img 
              src={currentImage.url}
              alt={currentImage.legenda || `${plantName} - Imagem ${currentIndex + 1}`}
              className={styles.modalImage}
            />
            
            {/* Legenda */}
            {currentImage.legenda && (
              <div className={styles.modalCaption}>
                <p className={styles.captionText}>{currentImage.legenda}</p>
              </div>
            )}
          </div>
          
          {/* Navegação próxima */}
          {images.length > 1 && (
            <button 
              onClick={nextImage}
              className={`${styles.navButton} ${styles.navNext}`}
              aria-label="Próxima imagem"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          )}
          
          {/* Indicadores */}
          {images.length > 1 && (
            <div className={styles.modalIndicators}>
              <div className={styles.imageCounter}>
                {currentIndex + 1} de {images.length}
              </div>
              
              {images.length <= 10 && (
                <div className={styles.dots}>
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
                      aria-label={`Ir para imagem ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>,
      document.body
    )
  }
  
  return (
    <>
      <div className={`${styles.gallery} ${className || ''}`}>
        <div className={styles.singleImageContainer}>
          <div className={styles.imageCard} onClick={openModal}>
            <div className={styles.imageContainer}>
              <img 
                src={firstImage.url}
                alt={firstImage.legenda || `${plantName} - Imagem principal`}
                className={styles.thumbnailImage}
              />
              
              {/* Overlay */}
              <div className={styles.imageOverlay}>
                <div className={styles.expandIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,3 21,3 21,9"></polyline>
                    <polyline points="9,21 3,21 3,15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                </div>
                
                {images.length > 1 && (
                  <div className={styles.multipleImagesIndicator}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    {images.length} imagens
                  </div>
                )}
              </div>
            </div>
            
            {/* Legenda */}
            {firstImage.legenda && (
              <div className={styles.thumbnailCaption}>
                <p className={styles.captionText}>{firstImage.legenda}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal renderizado globalmente */}
      {renderModal()}
    </>
  )
}