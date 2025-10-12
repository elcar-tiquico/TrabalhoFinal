// src/app/admin/plants/EditPlantWizard.tsx
// ✅ VERSÃO LIMPA PARA PRODUÇÃO - Sem informações de debug

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './add/add-plant.module.css';
import ReferenceBibliographyManager from './add/ReferenceBibliographyManager';
import PlantImageUploader from './add/PlantImageUploader';

// Configuração da API
const WIZARD_API_URL = 'http://localhost:5002/api/wizard';
const ADMIN_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// ✅ Interfaces
interface SelectOption {
  id: number;
  label: string;
  value: number;
}

interface UsoMedicinal {
  id_uso_planta?: number;
  id_parte: string;
  indicacoes: number[];
  metodos_preparacao: number[];
  metodos_extracao: number[];
  observacoes: string;
}

interface FormData {
  nome_cientifico: string;
  id_familia: string;
  numero_exsicata: string;
  nomes_comuns: string[];
  provincias: number[];
  usos: UsoMedicinal[];
  compostos: number[];
  propriedades: number[];
  referencias: number[];
  autores_referencias: any[];
  imagens: PlantImage[];  // ✅ ADICIONAR ESTA LINHA

}

interface PlantImage {
  id_imagem?: number;
  nome_arquivo?: string;
  file: File;
  url: string;
  legenda: string;
  ordem: number;
  isUploading?: boolean;
  isExisting?: boolean;
  toDelete?: boolean;
}

interface UsoEspecifico {
  id_uso_planta: number;
  id_uso: number;
  parte_usada: string;
  observacoes?: string;
  indicacoes: Array<{
    id_indicacao: number;
    descricao: string;
  }>;
  metodos_preparacao: Array<{
    id_preparacao: number;
    descricao: string;
  }>;
  metodos_extracao: Array<{
    id_extraccao: number;
    descricao: string;
  }>;
}

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
  usos_medicinais: Array<{
    id_uso: number;
    id_uso_planta: number;
    parte_usada: string;
    observacoes?: string;
  }>;
  usos_especificos?: UsoEspecifico[];
  compostos?: Array<{
    id_composto: number;
    nome_composto: string;
  }>;
  propriedades?: Array<{
    id_propriedade: number;
    descricao: string;
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
}

interface EditPlantWizardProps {
  plantaId: number;
}

const EditPlantWizard: React.FC<EditPlantWizardProps> = ({ plantaId }) => {
  const router = useRouter();
  
  // Estados principais
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dados da planta original
  const [originalPlanta, setOriginalPlanta] = useState<PlantaDetalhada | null>(null);

  // Dados do formulário
  const [formData, setFormData] = useState<FormData>({
    nome_cientifico: '',
    id_familia: '',
    numero_exsicata: '',
    nomes_comuns: [''],
    provincias: [],
    usos: [],
    compostos: [],
    propriedades: [],
    referencias: [],
    autores_referencias: [],
    imagens: []  // ✅ ADICIONAR ESTA LINHA

  });

  // Estados para dados das APIs
  const [familias, setFamilias] = useState<SelectOption[]>([]);
  const [provincias, setProvincias] = useState<SelectOption[]>([]);
  const [partesUsadas, setPartesUsadas] = useState<SelectOption[]>([]);
  const [indicacoes, setIndicacoes] = useState<SelectOption[]>([]);
  const [metodosPreparacao, setMetodosPreparacao] = useState<SelectOption[]>([]);
  const [metodosExtracao, setMetodosExtracao] = useState<SelectOption[]>([]);
  const [propriedades, setPropriedades] = useState<SelectOption[]>([]);
  const [compostos, setCompostos] = useState<SelectOption[]>([]);

  // ✅ Callbacks para referências
  const handleAuthorsFromReferencesChange = useCallback((autores: any[]): void => {
    setFormData(prev => ({ 
      ...prev, 
      autores_referencias: autores || [] 
    }));
  }, []);

  const handleReferencesChange = useCallback((referenciaIds: number[]): void => {
    setFormData(prev => ({ 
      ...prev, 
      referencias: referenciaIds || [] 
    }));
  }, []);

  const updateFormData = useCallback((field: keyof FormData, value: any): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ Inicialização
  useEffect(() => {
    const initializeEdit = async () => {
      try {
        await Promise.all([
          loadWizardData(),
          loadPlantaData()
        ]);
      } catch (error) {
        setError('Erro ao carregar dados para edição');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeEdit();
  }, [plantaId]);

  const loadWizardData = async (): Promise<void> => {
    try {
      const endpoints = [
        '/data/familias',
        '/data/provincias',
        '/data/partes-usadas',
        '/data/indicacoes',
        '/data/metodos-preparacao',
        '/data/metodos-extracao',
        '/data/propriedades',
        '/data/compostos'
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => 
          fetch(`${WIZARD_API_URL}${endpoint}`)
            .then(r => r.ok ? r.json() : [])
            .catch(() => [])
        )
      );

      setFamilias(responses[0] || []);
      setProvincias(responses[1] || []);
      setPartesUsadas(responses[2] || []);
      setIndicacoes(responses[3] || []);
      setMetodosPreparacao(responses[4] || []);
      setMetodosExtracao(responses[5] || []);
      setPropriedades(responses[6] || []);
      setCompostos(responses[7] || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados do wizard:', error);
    }
  };

  const loadUsosEspecificos = async (plantaId: number): Promise<UsoEspecifico[]> => {
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/admin/plantas/${plantaId}/usos-detalhados`);
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const loadPlantaData = async (): Promise<void> => {
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/admin/plantas/${plantaId}`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const planta: PlantaDetalhada = await response.json();
      setOriginalPlanta(planta);
      
      // Tentar carregar usos específicos
      const usosEspecificos = await loadUsosEspecificos(plantaId);
      
      // Mapear usos medicinais
      let usosParaFormulario: UsoMedicinal[] = [];
      
      if (usosEspecificos.length > 0) {
        usosParaFormulario = usosEspecificos.map((uso: UsoEspecifico) => ({
          id_uso_planta: uso.id_uso_planta,
          id_parte: uso.id_uso.toString(),
          indicacoes: uso.indicacoes?.map(ind => ind.id_indicacao) || [],
          metodos_preparacao: uso.metodos_preparacao?.map(met => met.id_preparacao) || [],
          metodos_extracao: uso.metodos_extracao?.map(met => met.id_extraccao) || [],
          observacoes: uso.observacoes || ''
        }));
      } else if (planta.usos_especificos && planta.usos_especificos.length > 0) {
        usosParaFormulario = planta.usos_especificos.map((uso: UsoEspecifico) => ({
          id_uso_planta: uso.id_uso_planta,
          id_parte: uso.id_uso.toString(),
          indicacoes: uso.indicacoes?.map(ind => ind.id_indicacao) || [],
          metodos_preparacao: uso.metodos_preparacao?.map(met => met.id_preparacao) || [],
          metodos_extracao: uso.metodos_extracao?.map(met => met.id_extraccao) || [],
          observacoes: uso.observacoes || ''
        }));
      } else {
        usosParaFormulario = planta.usos_medicinais.map(uso => ({
          id_uso_planta: uso.id_uso_planta,
          id_parte: uso.id_uso.toString(),
          indicacoes: [],
          metodos_preparacao: [],
          metodos_extracao: [],
          observacoes: uso.observacoes || ''
        }));
      }
      

      // ✅ ADICIONAR ESTE BLOCO antes do setFormData final
      const imagensResponse = await fetch(`${ADMIN_API_URL}/api/admin/plantas/${plantaId}/imagens`);
      let imagensExistentes: PlantImage[] = [];

      if (imagensResponse.ok) {
        const imagensData = await imagensResponse.json();
        imagensExistentes = imagensData.imagens.map((img: any) => {
          const dummyFile = new File([''], img.nome_arquivo, { type: 'image/jpeg' });
          
          return {
            id_imagem: img.id_imagem,
            nome_arquivo: img.nome_arquivo,
            ordem: img.ordem,
            legenda: img.legenda || '',
            url: `${ADMIN_API_URL}${img.url}`, // ✅ ADICIONAR ADMIN_API_URL            
            file: dummyFile,
            isExisting: true
          };
        });
      }
      // Aplicar dados ao formulário
      setFormData({
        nome_cientifico: planta.nome_cientifico,
        id_familia: planta.familia.id_familia.toString(),
        numero_exsicata: planta.numero_exsicata || '',
        nomes_comuns: planta.nomes_comuns.length > 0 
          ? planta.nomes_comuns.map(n => n.nome_comum)
          : [''],
        provincias: planta.provincias.map(p => p.id_provincia),
        usos: usosParaFormulario,
        compostos: planta.compostos?.map(c => c.id_composto) || [],
        propriedades: planta.propriedades?.map(p => p.id_propriedade) || [],
        referencias: planta.referencias.map(r => r.id_referencia),
        autores_referencias: [],
        imagens: imagensExistentes  // ✅ ADICIONAR ESTA LINHA

      });
      
    } catch (error) {
      setError(`Erro ao carregar dados da planta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // ✅ Validações
  const isStep1Valid = (): boolean => {
    return formData.nome_cientifico.trim() !== '' && formData.id_familia !== '';
  };

  const isStep2Valid = (): boolean => {
    const nomesComuns = formData.nomes_comuns.filter(nome => nome.trim() !== '');
    return nomesComuns.length > 0 && formData.provincias.length > 0;
  };

  const isStep3Valid = (): boolean => {
    if (formData.usos.length === 0) return false;
    return formData.usos.every(uso => uso.id_parte !== '' && uso.indicacoes.length > 0);
  };

  const isStep4Valid = (): boolean => {
    return true;
  };

  const isStep5Valid = (): boolean => {
    return true; // ✅ Imagens são opcionais
  };

  const isStep6Valid = (): boolean => {
    return formData.referencias.length > 0;
  };

  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1: return isStep1Valid();
      case 2: return isStep2Valid();
      case 3: return isStep3Valid();
      case 4: return isStep4Valid();
      case 5: return isStep5Valid(); // ✅ ADICIONAR ESTA LINHA
      case 6: return isStep6Valid(); // ✅ Era case 5 antes
      case 7: return true; 
      default: return false;
    }
  };

  // ✅ Navegação
  const handleNext = (): void => {
    if (isCurrentStepValid() && currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ✅ ADICIONAR estas funções auxiliares antes do handleSave
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const updateImages = async () => {
    const imagensVisiveis = formData.imagens.filter(img => !img.toDelete);
    const imagensNovas = imagensVisiveis.filter(img => !img.isExisting && img.file.size > 0);
    
    if (imagensNovas.length === 0 && !formData.imagens.some(img => img.toDelete)) {
      return;
    }

      let imagensProcessadas: Array<{
        file_data: string;
        file_extension: string;
        legenda: string;
        ordem: number;
        file_name: string;
        file_size: number;
      }> = [];
    if (imagensNovas.length > 0) {
      imagensProcessadas = await Promise.all(
        imagensNovas.map(async (imagem) => {
          const fileData = await convertImageToBase64(imagem.file);
          const fileExtension = imagem.file.name.split('.').pop()?.toLowerCase() || 'jpg';
          
          return {
            file_data: fileData,
            file_extension: fileExtension,
            legenda: imagem.legenda,
            ordem: imagem.ordem,
            file_name: imagem.file.name,
            file_size: imagem.file.size
          };
        })
      );
    }

    const dataToSend = {
      imagens: {
        manter: imagensVisiveis
          .filter(img => img.isExisting)
          .map(img => ({
            id_imagem: img.id_imagem,
            legenda: img.legenda,
            ordem: img.ordem
          })),
        excluir: formData.imagens
          .filter(img => img.isExisting && img.toDelete)
          .map(img => img.id_imagem),
        novas: imagensProcessadas
      }
    };

    const response = await fetch(`${ADMIN_API_URL}/api/admin/plantas/${plantaId}/imagens/manage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar imagens');
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!originalPlanta) return;
    
    setIsSaving(true);
    try {
      const dataToSave = {
        id_planta: originalPlanta.id_planta,
        nome_cientifico: formData.nome_cientifico,  // Obrigatório - já deve estar preenchido
        id_familia: parseInt(formData.id_familia),  // Obrigatório - já deve estar preenchido
        numero_exsicata: formData.numero_exsicata || '',  // ✅ OPCIONAL - proteger
        nomes_comuns: formData.nomes_comuns.filter(nome => nome.trim() !== ''),
        provincias: formData.provincias,
        usos: formData.usos.map(uso => ({
          ...uso,
          observacoes: uso.observacoes || '',  // ✅ OPCIONAL - proteger
          metodos_preparacao: uso.metodos_preparacao || [],  // ✅ OPCIONAL - proteger
          metodos_extracao: uso.metodos_extracao || []      // ✅ OPCIONAL - proteger
        })),
        compostos: formData.compostos || [],        // ✅ OPCIONAL - proteger
        propriedades: formData.propriedades || [],  // ✅ OPCIONAL - proteger
        referencias: formData.referencias
      };
      
      // Debug: verificar o que está a ser enviado
      console.log('Dados a enviar:', dataToSave);
      
      const response = await fetch(`${ADMIN_API_URL}/api/admin/plantas/${plantaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
      
      await updateImages();

      alert('✅ Alterações salvas com sucesso!');
      router.push(`/admin/plants?highlight=${plantaId}&t=${Date.now()}`);
      
    } catch (error) {
      alert(`Erro ao salvar alterações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (): void => {
    if (window.confirm('Tem certeza que deseja cancelar? Todas as alterações serão perdidas.')) {
      router.push('/admin/plants');
    }
  };

  // ✅ Gerenciar nomes comuns
  const addNomeComum = (): void => {
    updateFormData('nomes_comuns', [...formData.nomes_comuns, '']);
  };

  const removeNomeComum = (index: number): void => {
    const novosNomes = formData.nomes_comuns.filter((_, i) => i !== index);
    updateFormData('nomes_comuns', novosNomes);
  };

  const updateNomeComum = (index: number, value: string): void => {
    const novosNomes = [...formData.nomes_comuns];
    novosNomes[index] = value;
    updateFormData('nomes_comuns', novosNomes);
  };

  // ✅ Gerenciar usos medicinais
  const addUso = (): void => {
    const novoUso: UsoMedicinal = {
      id_parte: '',
      indicacoes: [],
      metodos_preparacao: [],
      metodos_extracao: [],
      observacoes: ''
    };
    updateFormData('usos', [...formData.usos, novoUso]);
  };

  const removeUso = (index: number): void => {
    const novosUsos = formData.usos.filter((_, i) => i !== index);
    updateFormData('usos', novosUsos);
  };

  const updateUso = (index: number, field: keyof UsoMedicinal, value: any): void => {
    const novosUsos = [...formData.usos];
    novosUsos[index] = { ...novosUsos[index], [field]: value };
    updateFormData('usos', novosUsos);
  };

  // ✅ Render do indicador de steps
  const renderStepIndicator = () => {
    const steps = [
      'Informações Básicas',
      'Identificação',
      'Usos Medicinais',
      'Composição',
      'Imagens',        // ✅ ADICIONAR ESTA LINHA
      'Referências',
      'Revisão'
    ];

    return (
      <div className={styles.stepIndicator}>
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`${styles.step} ${index + 1 === currentStep ? styles.active : ''} ${index + 1 < currentStep ? styles.completed : ''}`}
          >
            <div className={styles.stepNumber}>{index + 1}</div>
            <div className={styles.stepLabel}>{step}</div>
          </div>
        ))}
      </div>
    );
  };

  // ✅ Estados de carregamento
  if (isLoading) {
    return (
      <div className={styles.wizard}>
        <div className={styles.header}>
          <h1>Editar Planta Medicinal</h1>
        </div>
        <div className={styles.content}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            padding: '3rem',
            gap: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p>Carregando dados da planta...</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wizard}>
        <div className={styles.header}>
          <h1>Editar Planta Medicinal</h1>
        </div>
        <div className={styles.content}>
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center',
            color: '#dc2626'
          }}>
            <h2>❌ Erro ao Carregar</h2>
            <p>{error}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Tentar Novamente
              </button>
              <button 
                onClick={() => router.push('/admin/plants')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                ← Voltar à Lista
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!originalPlanta) {
    return (
      <div className={styles.wizard}>
        <div className={styles.header}>
          <h1>Editar Planta Medicinal</h1>
        </div>
        <div className={styles.content}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>❌ Planta não encontrada</h2>
            <button onClick={() => router.push('/admin/plants')}>
              ← Voltar à Lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Render dos steps
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <h2>Passo 1: Informações Básicas</h2>
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ color: '#1e40af', fontWeight: '500' }}>
                ✏️ Editando: <em>{originalPlanta.nome_cientifico}</em>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.required}>Nome Científico</label>
              <input
                type="text"
                value={formData.nome_cientifico}
                onChange={(e) => updateFormData('nome_cientifico', e.target.value)}
                placeholder="ex: Moringa oleifera"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.required}>Família</label>
              <select
                value={formData.id_familia}
                onChange={(e) => updateFormData('id_familia', e.target.value)}
              >
                <option value="">Selecione uma família</option>
                {familias.map(familia => (
                  <option key={familia.id} value={familia.value}>
                    {familia.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Informações Adicionais</label>
              <input
                type="text"
                value={formData.numero_exsicata}
                onChange={(e) => updateFormData('numero_exsicata', e.target.value)}
                // placeholder="ex: MOZ001"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <h2>Passo 2: Identificação</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.required}>Nomes Comuns</label>
              {formData.nomes_comuns.map((nome, index) => (
                <div key={index} className={styles.listItem}>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => updateNomeComum(index, e.target.value)}
                    placeholder="ex: Moringa, Árvore da vida"
                  />
                  {formData.nomes_comuns.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeNomeComum(index)}
                      className={styles.removeButton}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button"
                onClick={addNomeComum}
                className={styles.addButton}
              >
                + Adicionar Nome Comum
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.required}>Distribuição Geográfica</label>
              <div className={styles.checkboxGrid}>
                {provincias.map(provincia => (
                  <label key={provincia.id} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.provincias.includes(provincia.value)}
                      onChange={(e) => {
                        const novasProvincias = e.target.checked
                          ? [...formData.provincias, provincia.value]
                          : formData.provincias.filter(p => p !== provincia.value);
                        updateFormData('provincias', novasProvincias);
                      }}
                    />
                    {provincia.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <h2>Passo 3: Usos Medicinais</h2>
            <p className={styles.helper}>Edite os usos medicinais existentes ou adicione novos</p>
            
            {formData.usos.length === 0 && (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{ color: '#d97706', margin: 0 }}>
                  ⚠️ Nenhum uso medicinal foi adicionado ainda. Adicione pelo menos um uso.
                </p>
              </div>
            )}
            
            {formData.usos.map((uso, index) => (
              <div key={index} className={styles.usoCard}>
                <div className={styles.cardHeader}>
                  <h3>Uso {index + 1}</h3>
                  <button 
                    type="button"
                    onClick={() => removeUso(index)}
                    className={styles.removeButton}
                  >
                    ×
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.required}>Parte da Planta</label>
                  <select
                    value={uso.id_parte}
                    onChange={(e) => updateUso(index, 'id_parte', e.target.value)}
                    className={uso.id_parte === '' ? styles.error : ''}
                  >
                    <option value="">Selecione uma parte</option>
                    {partesUsadas.map(parte => (
                      <option key={parte.id} value={parte.value}>
                        {parte.label}
                      </option>
                    ))}
                  </select>
                  {uso.id_parte === '' && (
                    <span className={styles.errorText}>Parte da planta é obrigatória</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.required}>Indicações</label>
                  <p className={styles.helper}>Selecione pelo menos uma indicação</p>
                  <div className={`${styles.multiSelect} ${uso.indicacoes.length === 0 ? styles.error : ''}`}>
                    {indicacoes.map(indicacao => (
                      <label key={indicacao.id} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={uso.indicacoes.includes(indicacao.value)}
                          onChange={(e) => {
                            const novasIndicacoes = e.target.checked
                              ? [...uso.indicacoes, indicacao.value]
                              : uso.indicacoes.filter(i => i !== indicacao.value);
                            updateUso(index, 'indicacoes', novasIndicacoes);
                          }}
                        />
                        {indicacao.label}
                      </label>
                    ))}
                  </div>
                  {uso.indicacoes.length === 0 && (
                    <span className={styles.errorText}>Pelo menos uma indicação é obrigatória</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Métodos de Preparação</label>
                  <div className={styles.multiSelect}>
                    {metodosPreparacao.map(metodo => (
                      <label key={metodo.id} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={uso.metodos_preparacao.includes(metodo.value)}
                          onChange={(e) => {
                            const novosMetodos = e.target.checked
                              ? [...uso.metodos_preparacao, metodo.value]
                              : uso.metodos_preparacao.filter(m => m !== metodo.value);
                            updateUso(index, 'metodos_preparacao', novosMetodos);
                          }}
                        />
                        {metodo.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Métodos de Extração</label>
                  <div className={styles.multiSelect}>
                    {metodosExtracao.map(metodo => (
                      <label key={metodo.id} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={uso.metodos_extracao.includes(metodo.value)}
                          onChange={(e) => {
                            const novosMetodos = e.target.checked
                              ? [...uso.metodos_extracao, metodo.value]
                              : uso.metodos_extracao.filter(m => m !== metodo.value);
                            updateUso(index, 'metodos_extracao', novosMetodos);
                          }}
                        />
                        {metodo.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Observações</label>
                  <textarea
                    value={uso.observacoes}
                    onChange={(e) => updateUso(index, 'observacoes', e.target.value)}
                    placeholder="Observações específicas sobre este uso..."
                    rows={3}
                  />
                </div>
              </div>
            ))}

            <button 
              type="button"
              onClick={addUso}
              className={styles.addButton}
            >
              + Adicionar Uso Medicinal
            </button>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <h2>Passo 4: Composição Científica</h2>
            <p className={styles.helper}>Edite compostos químicos e propriedades farmacológicas (opcional)</p>
            
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #e0f2fe',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ color: '#0369a1', fontWeight: '500', marginBottom: '0.5rem' }}>
                ℹ️ Informação Opcional
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0c4a6e' }}>
                Esta etapa é opcional. Você pode adicionar informações sobre composição química 
                e propriedades farmacológicas, ou pular para as referências bibliográficas.
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>Compostos Químicos</label>
              <p className={styles.helper}>
                Selecione os compostos químicos identificados nesta planta
              </p>
              <div className={styles.multiSelect}>
                {compostos.map(composto => (
                  <label key={composto.id} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.compostos.includes(composto.value)}
                      onChange={(e) => {
                        const novosCompostos = e.target.checked
                          ? [...formData.compostos, composto.value]
                          : formData.compostos.filter(c => c !== composto.value);
                        updateFormData('compostos', novosCompostos);
                      }}
                    />
                    {composto.label}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Propriedades Farmacológicas</label>
              <p className={styles.helper}>
                Selecione as propriedades farmacológicas conhecidas desta planta
              </p>
              <div className={styles.multiSelect}>
                {propriedades.map(propriedade => (
                  <label key={propriedade.id} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.propriedades.includes(propriedade.value)}
                      onChange={(e) => {
                        const novasPropriedades = e.target.checked
                          ? [...formData.propriedades, propriedade.value]
                          : formData.propriedades.filter(p => p !== propriedade.value);
                        updateFormData('propriedades', novasPropriedades);
                      }}
                    />
                    {propriedade.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className={styles.stepContent}>
            <h2>Passo 5: Imagens da Planta</h2>
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ color: '#1e40af', fontWeight: '500' }}>
                📸 Gestão de Imagens
              </div>
              <div style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>
                Adicione, remova ou edite as imagens desta planta (opcional)
              </div>
            </div>

            <PlantImageUploader
              images={formData.imagens}
              onImagesChange={(images) => updateFormData('imagens', images)}
              maxImages={3}
            />
          </div>
        );

      case 6:
        return (
          <div className={styles.stepContent}>
            <h2>Passo 6: Referências Bibliográficas</h2>
            
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ color: '#1e40af', fontWeight: '500', marginBottom: '0.5rem' }}>
                ℹ️ Gerenciamento de Referências
              </div>
              <div style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>
                Adicione ou remova referências bibliográficas. Os autores serão atualizados automaticamente.
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.required}>Referências Bibliográficas</label>
              <ReferenceBibliographyManager
                selectedReferences={formData.referencias.map(id => ({
                  id,
                  label: `Referência ${id}`,
                  link: ''
                }))}
                onReferencesChange={handleReferencesChange}
                onAuthorsFromReferencesChange={handleAuthorsFromReferencesChange}
                apiUrl={WIZARD_API_URL}
              />
            </div>
          </div>
        );

      case 7:
        const familia = familias.find(f => f.value === parseInt(formData.id_familia));
        const provinciasNomes = provincias
          .filter(p => formData.provincias.includes(p.value))
          .map(p => p.label);
        const compostosNomes = compostos
          .filter(c => formData.compostos.includes(c.value))
          .map(c => c.label);
        const propriedadesNomes = propriedades
          .filter(p => formData.propriedades.includes(p.value))
          .map(p => p.label);

        return (
          <div className={styles.stepContent}>
            <h2>Passo 7: Revisão das Alterações</h2>
            
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #e0f2fe',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: '#0369a1', margin: '0 0 1rem 0' }}>
                📋 Resumo das Alterações
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h4 style={{ color: '#075985', borderBottom: '2px solid #e0f2fe', paddingBottom: '0.5rem' }}>
                    📄 Dados Originais
                  </h4>
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                    <p><strong>Nome Científico:</strong> <em>{originalPlanta.nome_cientifico}</em></p>
                    <p><strong>Família:</strong> {originalPlanta.familia.nome_familia}</p>
                    <p><strong>Exsicata:</strong> {originalPlanta.numero_exsicata || 'Não informado'}</p>
                    <p><strong>Nomes Comuns:</strong> {originalPlanta.nomes_comuns.map(n => n.nome_comum).join(', ')}</p>
                    <p><strong>Províncias:</strong> {originalPlanta.provincias.map(p => p.nome_provincia).join(', ')}</p>
                    <p><strong>Usos Medicinais:</strong> {originalPlanta.usos_medicinais.length}</p>
                    <p><strong>Compostos:</strong> {originalPlanta.compostos?.length || 0}</p>
                    <p><strong>Propriedades:</strong> {originalPlanta.propriedades?.length || 0}</p>
                    <p><strong>Referências:</strong> {originalPlanta.referencias.length}</p>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ color: '#075985', borderBottom: '2px solid #e0f2fe', paddingBottom: '0.5rem' }}>
                    ✏️ Dados Editados
                  </h4>
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                    <p><strong>Nome Científico:</strong> <em>{formData.nome_cientifico}</em></p>
                    <p><strong>Família:</strong> {familia?.label || 'Não selecionada'}</p>
                    <p><strong>Exsicata:</strong> {formData.numero_exsicata || 'Não informado'}</p>
                    <p><strong>Nomes Comuns:</strong> {formData.nomes_comuns.filter(n => n.trim()).join(', ')}</p>
                    <p><strong>Províncias:</strong> {provinciasNomes.join(', ')}</p>
                    <p><strong>Usos Medicinais:</strong> {formData.usos.length}</p>
                    <p><strong>Compostos:</strong> {formData.compostos.length}</p>
                    <p><strong>Propriedades:</strong> {formData.propriedades.length}</p>
                    <p><strong>Referências:</strong> {formData.referencias.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes dos Usos Medicinais */}
            <div style={{
              backgroundColor: '#fafafa',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ color: '#374151', margin: '0 0 1rem 0' }}>
                🌿 Usos Medicinais ({formData.usos.length})
              </h4>
              {formData.usos.length > 0 ? (
                formData.usos.map((uso, index) => {
                  const parte = partesUsadas.find(p => p.value === parseInt(uso.id_parte));
                  const inds = indicacoes
                    .filter(i => uso.indicacoes.includes(i.value))
                    .map(i => i.label);
                  
                  return (
                    <div key={index} style={{
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      padding: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.875rem' }}>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          <strong>Parte:</strong> {parte?.label || 'Não selecionada'}
                        </p>
                        <p style={{ margin: '0 0 0.25rem 0' }}>
                          <strong>Indicações:</strong> {inds.join(', ') || 'Nenhuma selecionada'}
                        </p>
                        {uso.observacoes && (
                          <p style={{ margin: '0 0 0.25rem 0' }}>
                            <strong>Observações:</strong> {uso.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#dc2626', fontStyle: 'italic', margin: 0 }}>
                  ⚠️ Nenhum uso medicinal foi adicionado
                </p>
              )}
            </div>

            {/* Composição Científica */}
            {(formData.compostos.length > 0 || formData.propriedades.length > 0) && (
              <div style={{
                backgroundColor: '#fafafa',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ color: '#374151', margin: '0 0 1rem 0' }}>
                  🧪 Composição Científica
                </h4>
                <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                  {compostosNomes.length > 0 && (
                    <p><strong>Compostos Químicos:</strong> {compostosNomes.join(', ')}</p>
                  )}
                  {propriedadesNomes.length > 0 && (
                    <p><strong>Propriedades Farmacológicas:</strong> {propriedadesNomes.join(', ')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Validação Final */}
            <div style={{
              backgroundColor: formData.referencias.length > 0 && formData.usos.length > 0 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${formData.referencias.length > 0 && formData.usos.length > 0 ? '#d1fae5' : '#fecaca'}`,
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h4 style={{ 
                color: formData.referencias.length > 0 && formData.usos.length > 0 ? '#065f46' : '#dc2626', 
                margin: '0 0 0.5rem 0' 
              }}>
                {formData.referencias.length > 0 && formData.usos.length > 0 ? '✅ Pronto para Salvar' : '⚠️ Ação Necessária'}
              </h4>
              {formData.referencias.length > 0 && formData.usos.length > 0 ? (
                <p style={{ color: '#065f46', margin: 0, fontSize: '0.875rem' }}>
                  Todas as informações obrigatórias foram preenchidas. 
                  Você pode salvar as alterações agora.
                </p>
              ) : (
                <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                  {formData.referencias.length === 0 && (
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      • Pelo menos uma referência bibliográfica é obrigatória
                    </p>
                  )}
                  {formData.usos.length === 0 && (
                    <p style={{ margin: 0 }}>
                      • Pelo menos um uso medicinal é obrigatório
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.stepContent}>
            <h2>Passo {currentStep}</h2>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>🚧 Este passo ainda não foi implementado...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.wizard}>
      <div className={styles.header}>
        <h1>Editar Planta Medicinal</h1>
        <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1.5rem' }}>
          <em>{originalPlanta.nome_cientifico}</em>
        </div>
        {renderStepIndicator()}
      </div>

      <div className={styles.content}>
        {renderCurrentStep()}
      </div>

      <div className={styles.navigation}>
        <button 
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className={styles.prevButton}
        >
          ← Anterior
        </button>

        <div className={styles.navInfo}>
          <button 
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            ❌ Cancelar
          </button>
          {!isCurrentStepValid() && (
            <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
              ⚠️ Complete os campos obrigatórios
            </span>
          )}
        </div>

        {currentStep < 7 ? (
          <button 
            type="button"
            onClick={handleNext}
            disabled={!isCurrentStepValid()}
            className={styles.nextButton}
          >
            Próximo →
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isCurrentStepValid()}
            className={styles.submitButton}
          >
            {isSaving ? '💾 Salvando...' : '💾 Salvar Alterações'}
          </button>
        )}
      </div>
    </div>
  );
};

export default EditPlantWizard;