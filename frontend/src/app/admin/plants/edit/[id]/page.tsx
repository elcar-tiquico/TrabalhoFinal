// src/app/admin/plants/edit/[id]/page.tsx

"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import EditPlantWizard from '../../EditPlantWizard';

export default function EditPlantPage() {
  const params = useParams();
  const plantaId = parseInt(params.id as string, 10);

  // Se o ID não for um número válido, mostrar erro
  if (isNaN(plantaId)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
          ❌ ID de Planta Inválido
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          O ID da planta fornecido não é válido: "{params.id}"
        </p>
        <a 
          href="/admin/plants"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.375rem',
            fontWeight: '500',
            transition: 'background-color 0.15s ease'
          }}
        >
          ← Voltar à Lista de Plantas
        </a>
      </div>
    );
  }

  // Se o ID for válido, renderizar o componente de edição
  return <EditPlantWizard plantaId={plantaId} />;
}