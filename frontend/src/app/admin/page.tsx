"use client";
import React from 'react';
import { useRouter } from 'next/navigation'; // ✅ adicionado
import styles from './landing.module.css';

export default function LandingPage() {
  const router = useRouter(); // ✅ adicionado

  const handleAdminAccess = () => {
    router.push('/admin/login'); // ✅ substitui o console.log
  };

  const plantas = [
    {
      nome: 'Warburgia salutaris',
      nomeLocal: 'Xibaha',
      icone: '🌿'
    },
    {
      nome: 'Moringa oleifera',
      nomeLocal: 'Moringa',
      icone: '🌱'
    },
    {
      nome: 'Aloe vera',
      nomeLocal: 'Babosa',
      icone: '🌵'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        {/* Conteúdo Principal */}
        <div className={styles.mainContent}>
          {/* Título */}
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              Base de Dados de{' '}
              <span className={styles.highlight}>
                Plantas Medicinais
              </span>
              {' '}de Moçambique
            </h1>
            <p className={styles.description}>
              Área administrativa para gerir informações sobre plantas medicinais e suas características.
            </p>
          </div>

          {/* Botão */}
          <div className={styles.buttonContainer}>
            <button 
              onClick={handleAdminAccess}
              className={styles.adminButton}
            >
              <svg 
                className={styles.buttonIcon}
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2Z" 
                  fill="currentColor"
                />
                <path 
                  d="M3 18C3 14.134 6.13401 11 10 11C13.866 11 17 14.134 17 18H3Z" 
                  fill="currentColor"
                />
              </svg>
              Acesso Administrativo
            </button>
          </div>
        </div>

        {/* Card de Plantas */}
        <div className={styles.plantCard}>
          {/* Decoração de fundo */}
          <div className={styles.cardDecoration}></div>
          
          {/* Header do Card */}
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.statusIndicator}></span>
              Página de Gestão de Plantas
            </h2>
          </div>

          {/* Lista de Plantas */}
          <div className={styles.plantList}>
            {plantas.map((planta, index) => (
              <div 
                key={index}
                className={styles.plantItem}
              >
                {/* Ícone da Planta */}
                <div className={styles.plantIcon}>
                  {planta.icone}
                </div>

                {/* Info da Planta */}
                <div className={styles.plantInfo}>
                  <div className={styles.plantName}>
                    {planta.nome}
                  </div>
                  <div className={styles.plantLocalName}>
                    {planta.nomeLocal}
                  </div>
                </div>

                {/* Seta */}
                <svg 
                  className={styles.plantArrow}
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none"
                >
                  <path 
                    d="M7 4L13 10L7 16" 
                    stroke="#002856" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
