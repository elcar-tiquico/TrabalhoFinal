import React from 'react';
import styles from './DeleteConfirmModal.module.css';

interface PlantaDetalhada {
  id_planta: number;
  nome_cientifico: string;
  numero_exsicata?: string;
  data_adicao: string;
  familia: {
    id_familia: number;
    nome_familia: string;
  };
  nomes_comuns: Array<{
    id_nome: number;
    nome_comum: string;
  }>;
  provincias: Array<{
    id_provincia: number;
    nome_provincia: string;
  }>;
  autores: Array<{
    id_autor: number;
    nome_autor: string;
    afiliacao?: string;
  }>;
  referencias: Array<{
    id_referencia: number;
    titulo?: string;
    tipo?: string;
    ano?: string;
    link?: string;
  }>;
  usos_medicinais: Array<{
    id_uso: number;
    parte_usada: string;
    observacoes?: string;
  }>;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  planta: PlantaDetalhada | null;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  isDeleting: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  planta,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !planta) return null;

  const handleConfirm = () => {
    if (planta && !isDeleting) {
      onConfirm(planta.id_planta);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  const formatarData = (dataString: string): string => {
    try {
      return new Date(dataString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            🗑️ Confirmar Exclusão
          </h2>
        </div>

        <div className={styles.modalBody}>
          {/* Informações da planta */}
          <div className={styles.plantInfo}>
            <div className={styles.plantName}>
              <em>{planta.nome_cientifico}</em>
            </div>
            <div className={styles.plantDetails}>
              <strong>Família:</strong> {planta.familia.nome_familia}<br />
              <strong>Nomes comuns:</strong> {planta.nomes_comuns.map(n => n.nome_comum).join(', ') || 'Não informado'}<br />
              <strong>Data de adição:</strong> {formatarData(planta.data_adicao)}<br />
              {planta.numero_exsicata && (
                <>
                  <strong>Exsicata:</strong> {planta.numero_exsicata}<br />
                </>
              )}
              <strong>Autores:</strong> {planta.autores.length}<br />
              <strong>Referências:</strong> {planta.referencias.length}<br />
              <strong>Usos medicinais:</strong> {planta.usos_medicinais.length}
            </div>
          </div>

          {/* Aviso */}
          <div className={styles.warningBox}>
            <div className={styles.warningTitle}>
              ⚠️ Atenção: Esta ação é irreversível!
            </div>
            <div className={styles.warningText}>
              Ao excluir esta planta, os seguintes dados serão <strong>permanentemente removidos</strong>:
              <ul>
                <li>Todas as informações da planta</li>
                <li>Nomes comuns associados</li>
                <li>Usos medicinais registrados</li>
                <li>Relações com autores e referências</li>
                <li>Histórico de adição e modificações</li>
              </ul>
              <strong>Tem certeza que deseja continuar?</strong>
            </div>
          </div>

          {isDeleting && (
            <div className={styles.deletingMessage}>
              🔄 Excluindo planta... Por favor, aguarde.
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.btnCancel}
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            className={`${styles.btnDelete} ${isDeleting ? styles.btnDeleteDisabled : ''}`}
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '🔄 Excluindo...' : '🗑️ Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;