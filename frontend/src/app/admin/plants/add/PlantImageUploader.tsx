import React, { useState, useRef } from 'react';
import styles from './PlantImageUploader.module.css'; // Importando o CSS Module simulado

// CSS Module simulado - em produção seria importado de PlantImageUploader.module.css
// const styles = {
//   imageUploader: 'imageUploader',
//   uploadArea: 'uploadArea',
//   uploadAreaActive: 'uploadAreaActive',
//   uploadIcon: 'uploadIcon',
//   uploadText: 'uploadText',
//   uploadSubtext: 'uploadSubtext',
//   imagesGrid: 'imagesGrid',
//   imageCard: 'imageCard',
//   imagePreview: 'imagePreview',
//   imageOrder: 'imageOrder',
//   legendaInput: 'legendaInput',
//   imageActions: 'imageActions',
//   moveButton: 'moveButton',
//   removeButton: 'removeButton',
//   uploadingOverlay: 'uploadingOverlay',
//   spinner: 'spinner',
//   helpText: 'helpText',
//   imageCounter: 'imageCounter',
//   hiddenInput: 'hiddenInput'
// };

// Interfaces
interface PlantImage {
  id?: number;
  file: File;
  url: string;
  legenda: string;
  ordem: number;
  isUploading?: boolean;
}

interface ImageUploaderProps {
  images: PlantImage[];
  onImagesChange: (images: PlantImage[]) => void;
  maxImages?: number;
  plantId?: number;
}

const PlantImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  maxImages = 3,
  plantId
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

const handleFiles = (fileList: FileList) => {
  console.log('📸 handleFiles called with:', fileList.length, 'files'); // ← ADICIONA
  
  const files = Array.from(fileList);
  const validFiles = files.filter(file => {
    const isImage = file.type.startsWith('image/');
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
    return isImage && isValidSize;
  });

  console.log('✅ Valid files:', validFiles.length); // ← ADICIONA

  if (images.length + validFiles.length > maxImages) {
    alert(`Máximo de ${maxImages} imagens permitidas`);
    return;
  }

  const newImages: PlantImage[] = validFiles.map((file, index) => ({
    file,
    url: URL.createObjectURL(file),
    legenda: '',
    ordem: images.length + index + 1
  }));

  console.log('🔥 Calling onImagesChange with:', newImages.length, 'new images'); // ← ADICIONA
  onImagesChange([...images, ...newImages]);
  console.log('📊 Total images after:', [...images, ...newImages].length); // ← ADICIONA
};

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const updateLegenda = (index: number, legenda: string) => {
    const updatedImages = images.map((img, i) => 
      i === index ? { ...img, legenda } : img
    );
    onImagesChange(updatedImages);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, ordem: i + 1 }));
    onImagesChange(updatedImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === images.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedImages = [...images];
    [updatedImages[index], updatedImages[newIndex]] = 
    [updatedImages[newIndex], updatedImages[index]];
    
    updatedImages.forEach((img, i) => img.ordem = i + 1);
    onImagesChange(updatedImages);
  };

  return (
    <div className={styles.imageUploader}>
      {/* Área de Upload */}
      {images.length < maxImages && (
        <div
          className={`${styles.uploadArea} ${dragActive ? styles.uploadAreaActive : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.uploadIcon}>📸</div>
          <div className={styles.uploadText}>
            {dragActive ? 'Solte as imagens aqui' : 'Adicionar Imagens da Planta'}
          </div>
          <div className={styles.uploadSubtext}>
            Formatos suportados: PNG, JPG, JPEG, GIF e WebP, máx. 5MB cada
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className={styles.hiddenInput}
          />
        </div>
      )}

      {/* Grid de Imagens */}
      {images.length > 0 && (
        <div className={styles.imagesGrid}>
          {images.map((image, index) => (
            <div key={index} className={styles.imageCard}>
              <div className={styles.imageOrder}>{image.ordem}</div>
              
              <img
                src={image.url}
                alt={`Planta ${index + 1}`}
                className={styles.imagePreview}
              />
              
              <input
                type="text"
                placeholder="Legenda da imagem (opcional)"
                value={image.legenda}
                onChange={(e) => updateLegenda(index, e.target.value)}
                className={styles.legendaInput}
              />
              
              <div className={styles.imageActions}>
                <button
                  onClick={() => moveImage(index, 'up')}
                  disabled={index === 0}
                  className={styles.moveButton}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveImage(index, 'down')}
                  disabled={index === images.length - 1}
                  className={styles.moveButton}
                >
                  ↓
                </button>
                <button
                  onClick={() => removeImage(index)}
                  className={styles.removeButton}
                >
                  ✕
                </button>
              </div>

              {image.isUploading && (
                <div className={styles.uploadingOverlay}>
                  <div className={styles.spinner}></div>
                  Enviando...
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Texto de Ajuda */}
      <div className={styles.helpText}>
        <p><strong>Dicas para melhores imagens:</strong></p>
        <ul>
          <li>Use imagens claras e bem iluminadas</li>
          <li>Mostre diferentes partes da planta (folhas, flores, frutos)</li>
          <li>Evite fundos confusos - prefira fundos neutros</li>
          <li>As imagens serão redimensionadas automaticamente</li>
        </ul>
        <p>
          <em>Formatos aceites: PNG, JPG, JPEG, GIF, WebP (máx. 5MB cada)</em>
        </p>
      </div>

      {/* Contador de imagens */}
      <div className={styles.imageCounter}>
        {images.length} imagens adicionadas
      </div>
    </div>
  );
};

export default PlantImageUploader;