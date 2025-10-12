"use client"

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface PlantImage {
  id_imagem: number
  nome_arquivo: string
  ordem: number
  legenda?: string
  url: string
  data_upload?: string
}

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  images: PlantImage[]
  currentIndex: number
  onNext: () => void
  onPrev: () => void
  plantName?: string
}

export default function ImageModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNext,
  onPrev,
  plantName
}: ImageModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-open')
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'ArrowLeft') onPrev()
        if (e.key === 'ArrowRight') onNext()
      }
      
      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        document.body.style.overflow = 'auto'
        document.body.classList.remove('modal-open')
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, onClose, onNext, onPrev])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Botão Fechar */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 bg-white/90 hover:bg-white text-black rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold transition-all duration-200 hover:scale-110 backdrop-blur-sm"
        aria-label="Fechar modal"
      >
        ×
      </button>

      {/* Container Principal */}
      <div 
        className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navegação Anterior */}
        {images.length > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-[-80px] top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-black rounded-full w-14 h-14 flex items-center justify-center text-3xl font-bold transition-all duration-200 hover:scale-110 backdrop-blur-sm"
            aria-label="Imagem anterior"
          >
            ‹
          </button>
        )}

        {/* Imagem Principal */}
        <div className="relative">
          <img
            src={currentImage.url}
            alt={currentImage.legenda || `${plantName} - Imagem ${currentIndex + 1}`}
            className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
            style={{ 
              animation: 'imageZoomIn 0.4s ease-out',
              filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5))'
            }}
          />
        </div>

        {/* Navegação Próxima */}
        {images.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-[-80px] top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-black rounded-full w-14 h-14 flex items-center justify-center text-3xl font-bold transition-all duration-200 hover:scale-110 backdrop-blur-sm"
            aria-label="Próxima imagem"
          >
            ›
          </button>
        )}

        {/* Legenda */}
        {currentImage.legenda && (
          <div className="absolute bottom-[-70px] left-0 right-0 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm max-w-full">
            <p className="text-sm leading-relaxed text-center m-0">
              {currentImage.legenda}
            </p>
          </div>
        )}

        {/* Indicadores */}
        <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          {/* Contador */}
          {images.length > 1 && (
            <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
              {currentIndex + 1} de {images.length}
            </div>
          )}

          {/* Dots de navegação */}
          {images.length > 1 && images.length <= 10 && (
            <div className="flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const event = new CustomEvent('setImageIndex', { detail: index })
                    document.dispatchEvent(event)
                  }}
                  className={`w-3 h-3 rounded-full border-none cursor-pointer transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-white scale-125'
                      : 'bg-white/40 hover:bg-white/70 hover:scale-110'
                  }`}
                  aria-label={`Ir para imagem ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estilos CSS inline para animações */}
      <style jsx>{`
        @keyframes imageZoomIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 768px) {
          .absolute.left-\\[-80px\\] {
            left: 20px !important;
            top: 20px !important;
            transform: none !important;
          }
          
          .absolute.right-\\[-80px\\] {
            right: 20px !important;
            top: 20px !important;
            transform: none !important;
          }
          
          .absolute.top-6.right-6 {
            top: 50% !important;
            right: 20px !important;
            transform: translateY(-50%) !important;
          }
        }
      `}</style>
    </div>
  )

  // Renderizar o modal usando portal para que apareça fora do contexto do componente
  return createPortal(modalContent, document.body)
}