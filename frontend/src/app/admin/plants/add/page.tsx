"use client";
import React, { useState, useEffect, useCallback } from 'react';
import styles from './add-plant.module.css';
import ReferenceBibliographyManager from './ReferenceBibliographyManager';
// No topo do ficheiro, junto com as outras importações
import PlantImageUploader from './PlantImageUploader';

// Configuração da API do Wizard
const WIZARD_API_URL = 'http://localhost:5000/api/wizard';

// Interfaces TypeScript
interface SelectOption {
  id: number;
  label: string;
  value: number;
}

interface UsoMedicinal {
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
  referencias: number[]; // ✅ APENAS referências - autores vêm delas
  autores_referencias: any[]; // ✅ Autores automaticamente das referências
  imagens: PlantImage[];
}

interface ValidationErrors {
  [key: string]: string;
}

// Adiciona esta interface junto com as outras (depois da linha 20)
interface PlantImage {
  id?: number;
  file: File;
  url: string;
  legenda: string;
  ordem: number;
  isUploading?: boolean;
}

interface ApiValidationResponse {
  valid: boolean;
  errors?: ValidationErrors;
  warnings?: string[];
}

interface ApiCreateResponse {
  planta: any;
}

interface ApiErrorResponse {
  error: string;
}

interface DraftResponse {
  draft_id: string;
}

const CreatePlantWizard: React.FC = () => {
  // Estados principais
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);

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
    imagens: [] // ← ADICIONA ESTA LINHA
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

  // ✅ Callback para autores das referências (automaticamente)
  const handleAuthorsFromReferencesChange = useCallback((autores: any[]): void => {
    setFormData(prev => ({ 
      ...prev, 
      autores_referencias: autores || [] 
    }));
  }, []);

  // ✅ Callback para referências (OBRIGATÓRIO)
  const handleReferencesChange = useCallback((referenciaIds: number[]): void => {
    setFormData(prev => ({ 
      ...prev, 
      referencias: referenciaIds || [] 
    }));
  }, []);

  // ✅ updateFormData tipado corretamente
  const updateFormData = useCallback((field: keyof FormData, value: any): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field) {
      setErrors(prev => {
        if (prev[field]) {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
        return prev;
      });
    }
  }, []);

  // Verificar conexão com API no início
  useEffect(() => {
    checkApiConnection();
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (isApiConnected) {
      loadWizardData();
    }
  }, [isApiConnected]);

  // Auto-save a cada 30 segundos
  useEffect(() => {
    if (!isApiConnected) return;
    
    const interval = setInterval(() => {
      if (formData.nome_cientifico || formData.id_familia) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, isApiConnected]);

  // ✅ VALIDAÇÕES ATUALIZADAS - Referências obrigatórias no Step 5
  const isStep1Valid = (): boolean => {
    return formData.nome_cientifico.trim() !== '' && formData.id_familia !== '';
  };

  const isStep2Valid = (): boolean => {
    const nomesComuns = formData.nomes_comuns.filter(nome => nome.trim() !== '');
    return nomesComuns.length > 0 && formData.provincias.length > 0;
  };

  const isStep3Valid = (): boolean => {
    if (formData.usos.length === 0) return false;
    
    return formData.usos.every(uso => 
      uso.id_parte !== '' && uso.indicacoes.length > 0
    );
  };

  const isStep4Valid = (): boolean => {
    return true; // Composição científica opcional
  };

  const isStep5Valid = (): boolean => {
    // ✅ IMAGENS AGORA SÃO OBRIGATÓRIAS
    return formData.imagens.length > 0;
  };

  const isStep6Valid = (): boolean => {
    // ✅ REFERÊNCIAS AGORA SÃO OBRIGATÓRIAS
    return formData.referencias.length > 0;
  };

  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1: return isStep1Valid();
      case 2: return isStep2Valid();
      case 3: return isStep3Valid();
      case 4: return isStep4Valid();
      case 5: return isStep5Valid();
      case 6: return isStep6Valid();
      case 7: return true; // Revisão final não precisa de validação
      default: return false;
    }
  };

  const checkApiConnection = async (): Promise<void> => {
    try {
      const response = await fetch(`${WIZARD_API_URL}/health`);
      if (response.ok) {
        setIsApiConnected(true);
        console.log('✅ Conectado à Wizard API (porta 5002)');
      } else {
        throw new Error('API não disponível');
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com Wizard API:', error);
      setIsApiConnected(false);
      alert('Erro: Wizard API não está disponível na porta 5002.\nInicie a API com: python wizard_api.py');
    }
  };

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

      setFamilias(responses[0]);
      setProvincias(responses[1]);
      setPartesUsadas(responses[2]);
      setIndicacoes(responses[3]);
      setMetodosPreparacao(responses[4]);
      setMetodosExtracao(responses[5]);
      setPropriedades(responses[6]);
      setCompostos(responses[7]);
      
      console.log('✅ Dados do wizard carregados');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const saveDraft = async (): Promise<void> => {
    if (!isApiConnected) return;
    
    try {
      const response = await fetch(`${WIZARD_API_URL}/plantas/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, draft_id: draftId })
      });

      if (response.ok) {
        const result: DraftResponse = await response.json();
        if (!draftId) {
          setDraftId(result.draft_id);
        }
        console.log('💾 Rascunho guardado automaticamente');
      }
    } catch (error) {
      console.error('Erro ao guardar rascunho:', error);
    }
  };

  const validateStep = async (step: number): Promise<boolean> => {
    if (!isApiConnected) return true;
    
    try {
      const response = await fetch(`${WIZARD_API_URL}/plantas/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data: formData })
      });

      const result: ApiValidationResponse = await response.json();
      setErrors(result.errors || {});
      setWarnings(result.warnings || []);
      
      return result.valid;
    } catch (error) {
      console.error('Erro na validação:', error);
      return false;
    }
  };

  const handleNext = async (): Promise<void> => {
    if (!isCurrentStepValid()) {
      showValidationErrors();
      return;
    }

    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 7) {
      setCurrentStep(currentStep + 1);
      await saveDraft();
    }
  };

  // ✅ VALIDAÇÕES ATUALIZADAS
  const showValidationErrors = (): void => {
    const newErrors: ValidationErrors = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.nome_cientifico.trim()) {
          newErrors.nome_cientifico = 'Nome científico é obrigatório';
        }
        if (!formData.id_familia) {
          newErrors.id_familia = 'Família é obrigatória';
        }
        break;
        
      case 2:
        const nomesComuns = formData.nomes_comuns.filter(nome => nome.trim() !== '');
        if (nomesComuns.length === 0) {
          newErrors.nomes_comuns = 'Pelo menos um nome comum é obrigatório';
        }
        if (formData.provincias.length === 0) {
          newErrors.provincias = 'Pelo menos uma província deve ser selecionada';
        }
        break;
        
      case 3:
        if (formData.usos.length === 0) {
          newErrors.usos = 'Pelo menos um uso medicinal deve ser adicionado';
        } else {
          formData.usos.forEach((uso, index) => {
            if (!uso.id_parte) {
              newErrors[`usos[${index}].id_parte`] = 'Parte da planta é obrigatória';
            }
            if (uso.indicacoes.length === 0) {
              newErrors[`usos[${index}].indicacoes`] = 'Pelo menos uma indicação é obrigatória';
            }
          });
        }
        break;
        
      case 4:
        // Composição científica é opcional
        break;
      
        case 5:
          // Imagens são opcionais, mas podes adicionar warnings
          if (formData.imagens.length === 0) {
            newErrors.imagens = 'Pelo menos uma imagem da planta deve ser adicionada';
          }
          break;  

      case 6:
        // ✅ REFERÊNCIAS AGORA OBRIGATÓRIAS
        if (formData.referencias.length === 0) {
          newErrors.referencias = 'Pelo menos uma referência bibliográfica deve ser adicionada';
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handlePrevious = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (): Promise<void> => {
    if (!isApiConnected) {
      alert('Erro: API não conectada');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('📤 Iniciando criação da planta...');
      console.log('🖼️ Imagens a processar:', formData.imagens.length);

      // ✅ CONVERTER IMAGENS PARA BASE64
      let imagensProcessadas: string | any[] = [];
      
      if (formData.imagens.length > 0) {
        console.log('🔄 Convertendo imagens para base64...');
        
        imagensProcessadas = await Promise.all(
          formData.imagens.map(async (imagem, index) => {
            try {
              const fileData = await convertImageToBase64(imagem.file);
              const fileExtension = imagem.file.name.split('.').pop()?.toLowerCase() || 'jpg';
              
              console.log(`   ✅ Imagem ${index + 1} convertida: ${imagem.file.name}`);
              
              return {
                file_data: fileData,
                file_extension: fileExtension,
                legenda: imagem.legenda,
                ordem: imagem.ordem,
                file_name: imagem.file.name,
                file_size: imagem.file.size
              };
            } catch (error) {
              console.error(`   ❌ Erro ao converter imagem ${index + 1}:`, error);
              throw new Error(`Erro ao processar imagem: ${imagem.file.name}`);
            }
          })
        );
        
        console.log('✅ Todas as imagens convertidas com sucesso!');
      }

      // ✅ PREPARAR DADOS PARA ENVIO (sem objetos File)
      const dataToSend = {
        nome_cientifico: formData.nome_cientifico,
        id_familia: formData.id_familia,
        numero_exsicata: formData.numero_exsicata,
        nomes_comuns: formData.nomes_comuns,
        provincias: formData.provincias,
        usos: formData.usos,
        compostos: formData.compostos,
        propriedades: formData.propriedades,
        referencias: formData.referencias,
        autores_referencias: formData.autores_referencias,
        imagens: imagensProcessadas, // ← Imagens convertidas para base64
        draft_id: draftId
      };

      console.log('📊 Dados preparados para envio:', {
        ...dataToSend,
        imagens: `${imagensProcessadas.length} imagens processadas`
      });

      // ✅ ENVIAR DADOS
      const response = await fetch(`${WIZARD_API_URL}/plantas/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result: ApiCreateResponse = await response.json();
        console.log('🎉 Planta criada com sucesso!', result);
        
        alert(`🎉 Planta "${formData.nome_cientifico}" criada com sucesso!\n📸 ${imagensProcessadas.length} imagens adicionadas`);
        
        // Limpar formulário
        setFormData({
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
          imagens: []
        });
        setCurrentStep(1);
        setDraftId(null);
        setErrors({});
        
      } else {
        const error: ApiErrorResponse = await response.json();
        console.error('❌ Erro na criação:', error);
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('💥 Erro ao criar planta:', error);
      
      if (error instanceof Error) {
        alert(`Erro ao criar planta: ${error.message}`);
      } else {
        alert('Erro desconhecido ao criar planta. Verifique a consola para mais detalhes.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    
    if (errors.nomes_comuns && novosNomes.some(nome => nome.trim() !== '')) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.nomes_comuns;
        return newErrors;
      });
    }
  };

  const addUso = (): void => {
    const novoUso: UsoMedicinal = {
      id_parte: '',
      indicacoes: [],
      metodos_preparacao: [],
      metodos_extracao: [],
      observacoes: ''
    };
    updateFormData('usos', [...formData.usos, novoUso]);
    
    if (errors.usos) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.usos;
        return newErrors;
      });
    }
  };

  const removeUso = (index: number): void => {
    const novosUsos = formData.usos.filter((_, i) => i !== index);
    updateFormData('usos', novosUsos);
  };

  const updateUso = (index: number, field: keyof UsoMedicinal, value: any): void => {
    const novosUsos = [...formData.usos];
    novosUsos[index] = { ...novosUsos[index], [field]: value };
    updateFormData('usos', novosUsos);
    
    const errorKey = `usos[${index}].${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      'Informações Básicas',
      'Identificação', 
      'Usos Medicinais',
      'Composição',
      'Imagens',        // ← ADICIONA ESTA LINHA
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

  // Mostrar mensagem se API não conectada
  if (!isApiConnected) {
    return (
      <div className={styles.wizard}>
        <div className={styles.header}>
          <h1>Criar Nova Planta Medicinal</h1>
        </div>
        <div className={styles.content}>
          <div className={styles.placeholder}>
            <h2>⚠️ API do Wizard não disponível</h2>
            <p>A API do wizard deve estar em execução na porta 5002.</p>
            <p><strong>Para iniciar a API:</strong></p>
            <code>python wizard_api.py</code>
            <br /><br />
            <button onClick={checkApiConnection} className={styles.addButton}>
              🔄 Tentar Reconectar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className={styles.stepContent}>
      <h2>Passo 1: Informações Básicas</h2>
      
      <div className={styles.formGroup}>
        <label className={styles.required}>Nome Científico</label>
        <input
          type="text"
          value={formData.nome_cientifico}
          onChange={(e) => updateFormData('nome_cientifico', e.target.value)}
          placeholder="ex: Moringa oleifera"
          className={errors.nome_cientifico ? styles.error : ''}
        />
        {errors.nome_cientifico && (
          <span className={styles.errorText}>{errors.nome_cientifico}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.required}>Família</label>
        <select
          value={formData.id_familia}
          onChange={(e) => updateFormData('id_familia', e.target.value)}
          className={errors.id_familia ? styles.error : ''}
        >
          <option value="">Selecione uma família</option>
          {familias.map(familia => (
            <option key={familia.id} value={familia.value}>
              {familia.label}
            </option>
          ))}
        </select>
        {errors.id_familia && (
          <span className={styles.errorText}>{errors.id_familia}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Informações Adicionais (ex.: curiosidades)</label>
        <input
          type="text"
          value={formData.numero_exsicata}
          onChange={(e) => updateFormData('numero_exsicata', e.target.value)}
          // placeholder="ex: MOZ001"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.stepContent}>
      <h2>Passo 2: Identificação</h2>
      
      <div className={styles.formGroup}>
        <label className={styles.required}>Nomes Comuns</label>
        <p className={styles.helper}>Pelo menos um nome comum é obrigatório</p>
        {formData.nomes_comuns.map((nome, index) => (
          <div key={index} className={styles.listItem}>
            <input
              type="text"
              value={nome}
              onChange={(e) => updateNomeComum(index, e.target.value)}
              placeholder="ex: Moringa, Árvore da vida"
              className={errors.nomes_comuns ? styles.error : ''}
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
        {errors.nomes_comuns && (
          <span className={styles.errorText}>{errors.nomes_comuns}</span>
        )}
        <button 
          type="button"
          onClick={addNomeComum}
          className={styles.addButton}
        >
          + Adicionar Nome Comum
        </button>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.required}>Distribuição Geográfica (Províncias)</label>
        <p className={styles.helper}>Selecione pelo menos uma província</p>
        <div className={`${styles.checkboxGrid} ${errors.provincias ? styles.error : ''}`}>
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
                  
                  if (errors.provincias && novasProvincias.length > 0) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.provincias;
                      return newErrors;
                    });
                  }
                }}
              />
              {provincia.label}
            </label>
          ))}
        </div>
        {errors.provincias && (
          <span className={styles.errorText}>{errors.provincias}</span>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.stepContent}>
      <h2>Passo 3: Usos Medicinais</h2>
      <p className={styles.helper}>Pelo menos um uso medicinal deve ser adicionado</p>
      
      {errors.usos && (
        <div className={styles.errorText} style={{ marginBottom: '16px' }}>
          {errors.usos}
        </div>
      )}
      
      {formData.usos.map((uso, index) => (
        <div key={index} className={styles.usoCard}>
          <div className={styles.cardHeader}>
            <h3>Uso {index + 1}</h3>
            {formData.usos.length > 1 && (
              <button 
                type="button"
                onClick={() => removeUso(index)}
                className={styles.removeButton}
              >
                ×
              </button>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.required}>Parte da Planta</label>
            <select
              value={uso.id_parte}
              onChange={(e) => updateUso(index, 'id_parte', e.target.value)}
              className={errors[`usos[${index}].id_parte`] ? styles.error : ''}
            >
              <option value="">Selecione uma parte</option>
              {partesUsadas.map(parte => (
                <option key={parte.id} value={parte.value}>
                  {parte.label}
                </option>
              ))}
            </select>
            {errors[`usos[${index}].id_parte`] && (
              <span className={styles.errorText}>{errors[`usos[${index}].id_parte`]}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.required}>Indicações</label>
            <p className={styles.helper}>Selecione pelo menos uma indicação</p>
            <div className={`${styles.multiSelect} ${errors[`usos[${index}].indicacoes`] ? styles.error : ''}`}>
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
            {errors[`usos[${index}].indicacoes`] && (
              <span className={styles.errorText}>{errors[`usos[${index}].indicacoes`]}</span>
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
        + Adicionar Uso
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div className={styles.stepContent}>
      <h2>Passo 4: Composição Científica</h2>
      <p className={styles.helper}>Adicione compostos químicos e/ou propriedades farmacológicas (opcional)</p>
      
      <div className={styles.formGroup}>
        <label>Compostos Químicos</label>
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

  const renderStep5 = () => (
    <div className={styles.stepContent}>
      <h2>Passo 5: Imagens da Planta</h2>
      <PlantImageUploader
        images={formData.imagens}
        onImagesChange={(images) => updateFormData('imagens', images)}
        maxImages={3}
      />
      {errors.imagens && (
        <span className={styles.errorText}>{errors.imagens}</span>
      )}
    </div>
  );

  // ✅ STEP 5 ATUALIZADO - Referências OBRIGATÓRIAS, sem autores adicionais
  const renderStep6 = () => (
    <div className={styles.stepContent}>
      <h2>Passo 6: Referências Bibliográficas</h2>
      <p className={styles.helper}>
        <strong>Adicione referências bibliográficas sobre esta planta (obrigatório)</strong>
      </p>
      <p className={styles.helper}>
        Os autores da planta serão automaticamente os autores das referências selecionadas.
      </p>
      
      {/* ✅ Mostrar autores das referências */}
      {formData.autores_referencias && formData.autores_referencias.length > 0 && (
        <div className={styles.formGroup}>
          <label>Autores (das referências selecionadas)</label>
          <div className={styles.multiSelect}>
            {formData.autores_referencias.map((autor: any, index: number) => (
              <div key={`autor-ref-${autor.id_autor}-${index}`} className={styles.checkbox}>
                <span>
                  ✅ {autor.nome_autor}
                  {autor.afiliacao && ` (${autor.afiliacao})`}
                  <span style={{ color: '#10b981', fontSize: '0.8rem', marginLeft: '8px' }}>
                    📚 Autor da referência
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.required}>Referências Bibliográficas</label>
        <p className={styles.helper}>
          Selecione ou adicione referências científicas sobre esta planta
        </p>
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
        
        {errors.referencias && (
          <span className={styles.errorText}>{errors.referencias}</span>
        )}
      </div>
    </div>
  );

  const renderStep7 = () => {
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
        <h2>Passo 7: Revisão Final</h2>
        
        <div className={styles.review}>
          <div className={styles.reviewSection}>
            <h3>Informações Básicas</h3>
            <p><strong>Nome Científico:</strong> {formData.nome_cientifico}</p>
            <p><strong>Família:</strong> {familia?.label}</p>
            {formData.numero_exsicata && (
              <p><strong>Exsicata:</strong> {formData.numero_exsicata}</p>
            )}
          </div>

          <div className={styles.reviewSection}>
            <h3>Identificação</h3>
            <p><strong>Nomes Comuns:</strong> {formData.nomes_comuns.filter(n => n.trim()).join(', ')}</p>
            <p><strong>Províncias:</strong> {provinciasNomes.join(', ')}</p>
          </div>

          <div className={styles.reviewSection}>
            <h3>Usos Medicinais</h3>
            {formData.usos.map((uso, index) => {
              const parte = partesUsadas.find(p => p.value === parseInt(uso.id_parte));
              const inds = indicacoes
                .filter(i => uso.indicacoes.includes(i.value))
                .map(i => i.label);
              
              return (
                <div key={index} className={styles.reviewUso}>
                  <p><strong>Parte:</strong> {parte?.label}</p>
                  <p><strong>Indicações:</strong> {inds.join(', ')}</p>
                  {uso.observacoes && (
                    <p><strong>Observações:</strong> {uso.observacoes}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.reviewSection}>
            <h3>Composição Científica</h3>
            {compostosNomes.length > 0 && (
              <p><strong>Compostos Químicos:</strong> {compostosNomes.join(', ')}</p>
            )}
            {propriedadesNomes.length > 0 && (
              <p><strong>Propriedades Farmacológicas:</strong> {propriedadesNomes.join(', ')}</p>
            )}
            {compostosNomes.length === 0 && propriedadesNomes.length === 0 && (
              <p className={styles.noData}>Nenhuma informação de composição adicionada</p>
            )}
          </div>

          {/* ✅ NOVA SECÇÃO DE IMAGENS */}
          <div className={styles.reviewSection}>
            <h3>Imagens da Planta</h3>
            {formData.imagens.length > 0 ? (
              <>
                <p><strong>Total de imagens:</strong> {formData.imagens.length}</p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '12px', 
                  marginTop: '12px' 
                }}>
                  {formData.imagens.map((imagem, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px', 
                      padding: '8px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                    }}>
                      <img 
                        src={imagem.url} 
                        alt={`Imagem ${index + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '100px', 
                          objectFit: 'cover', 
                          borderRadius: '4px',
                          marginBottom: '8px'
                        }}
                      />
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: '#6b7280', 
                        margin: '0',
                        textAlign: 'center'
                      }}>
                        📸 Imagem {imagem.ordem}
                        {imagem.legenda && (
                          <span style={{ display: 'block', fontStyle: 'italic' }}>
                            "{imagem.legenda}"
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.errorText}>⚠️ Nenhuma imagem adicionada (obrigatório)</p>
            )}
          </div>

          <div className={styles.reviewSection}>
            <h3>Referências e Autores</h3>
            {formData.referencias.length > 0 && (
              <p><strong>Referências:</strong> {formData.referencias.length} adicionadas</p>
            )}
            {formData.autores_referencias.length > 0 && (
              <>
                <p><strong>Autores (das referências):</strong> {formData.autores_referencias.length} autores</p>
                <div style={{ marginTop: '8px' }}>
                  {formData.autores_referencias.map((autor: any, index: number) => (
                    <span key={autor.id_autor} style={{ display: 'inline-block', marginRight: '12px', marginBottom: '4px' }}>
                      📚 {autor.nome_autor}
                      {autor.afiliacao && ` (${autor.afiliacao})`}
                    </span>
                  ))}
                </div>
              </>
            )}
            {formData.referencias.length === 0 && (
              <p className={styles.errorText}>⚠️ Nenhuma referência bibliográfica adicionada (obrigatório)</p>
            )}
          </div>

          {warnings.length > 0 && (
            <div className={styles.warnings}>
              <h4>Avisos:</h4>
              {warnings.map((warning, index) => (
                <p key={index} className={styles.warning}>⚠️ {warning}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Se usas um switch case (procura por algo assim no código)
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2(); 
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5(); // ← ADICIONA ESTA LINHA
      case 6: return renderStep6();
      case 7: return renderStep7(); // ← O que era step 6 agora é 7
      default: return renderStep1();
    }
  };

  return (
    <div className={styles.wizard}>
      <div className={styles.header}>
        <h1>Criar Nova Planta Medicinal</h1>
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
          {draftId && (
            <span className={styles.autoSave}>💾 Auto-guardado</span>
          )}
          {!isCurrentStepValid() && currentStep < 7 && (
            <span className={styles.errorText}>
              ⚠️ Complete os campos obrigatórios para avançar
            </span>
          )}
          {isCurrentStepValid() && currentStep === 4 && (
            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              ✓ Passo opcional - pode avançar
            </span>
          )}
          {currentStep === 6 && formData.referencias.length === 0 && (
            <span className={styles.errorText}>
              ⚠️ Referências bibliográficas são obrigatórias
            </span>
          )}
        </div>

        {currentStep < 7 ? (
          <button 
            type="button"
            onClick={handleNext}
            disabled={!isCurrentStepValid()}
            className={styles.nextButton}
            title={!isCurrentStepValid() ? "Complete os campos obrigatórios para avançar" : ""}
          >
            Próximo →
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !isCurrentStepValid()}
            className={styles.submitButton}
          >
            {isLoading ? 'Criando...' : 'Criar Planta'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreatePlantWizard;