import React from 'react';
import modalStyles from '../admin/plants/modal.module.css';

// ✅ DEFINIR TIPOS ESPECÍFICOS
interface PlantaImagem {
  id_imagem: number;
  nome_arquivo: string;
  ordem: number;
  legenda?: string;
  url: string;
  data_upload?: string;
}

interface PlantImageGalleryProps {
  imagens?: PlantaImagem[];
}

const PlantImageGallery: React.FC<PlantImageGalleryProps> = ({ imagens = [] }) => {
  if (!imagens || imagens.length === 0) {
    return (
      <div className={modalStyles.noData}>
        📷 Nenhuma imagem disponível
      </div>
    );
  }

  return (
    <div className={modalStyles.imageGallery}>
      {imagens.map((imagem: PlantaImagem, index: number) => (
        <div key={imagem.id_imagem} className={modalStyles.imageCard}>
          <div className={modalStyles.imageContainer}>
            <img 
              src={`http://localhost:5001${imagem.url}`}
              alt={imagem.legenda || `Imagem ${index + 1} da planta`}
              className={modalStyles.plantImage}
              loading="lazy"
            />
            <div className={modalStyles.imageOverlay}>
              <span className={modalStyles.imageNumber}>{index + 1}</span>
            </div>
          </div>
          
          {imagem.legenda && (
            <div className={modalStyles.imageCaption}>
              {imagem.legenda}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlantImageGallery;