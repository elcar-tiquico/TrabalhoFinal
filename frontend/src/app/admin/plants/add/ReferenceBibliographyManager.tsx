import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './ReferenceBibliographyManager.module.css';
import AuthorManager from './AuthorManager'; // Importar o AuthorManager

// Interfaces TypeScript
interface Reference {
  id: number;
  label: string;
  titulo?: string;
  link: string;
  tipo?: 'URL' | 'Artigo' | 'Livro' | 'Tese';
  ano?: string;
}

interface NewReference {
  titulo_referencia: string;
  link_referencia: string;
  tipo_referencia: 'URL' | 'Artigo' | 'Livro' | 'Tese';
  ano: string;
  autores: Author[]; // ✅ NOVO: Adicionar autores
}

interface Author {
  id_autor?: number;
  nome_autor: string;
  afiliacao?: string;
  sigla_afiliacao?: string;
  papel?: 'primeiro' | 'correspondente' | 'coautor';
  ordem_autor?: number;
  isNew?: boolean;
}

interface ReferenceBibliographyManagerProps {
  selectedReferences?: Reference[];
  onReferencesChange: (references: number[]) => void;
  onAuthorsFromReferencesChange?: (authors: any[]) => void;
  apiUrl: string;
}

interface CreatedReferenceResponse {
  id_referencia: number;
  titulo_referencia?: string;
  link_referencia: string;
  tipo_referencia?: 'URL' | 'Artigo' | 'Livro' | 'Tese';
  ano?: string;
  autores: any[];
}

interface ApiErrorResponse {
  error: string;
}

const ReferenceBibliographyManager: React.FC<ReferenceBibliographyManagerProps> = ({ 
  selectedReferences = [], 
  onReferencesChange, 
  onAuthorsFromReferencesChange,
  apiUrl 
}) => {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Reference[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // ✅ Estado interno para mapear IDs -> objetos completos (para display)
  const [referencesMap, setReferencesMap] = useState<Map<number, Reference>>(new Map());

  // ✅ Estado do formulário de criação ATUALIZADO
  const [newReference, setNewReference] = useState<NewReference>({
    titulo_referencia: '',
    link_referencia: '',
    tipo_referencia: 'Artigo',
    ano: '',
    autores: [] // ✅ NOVO
  });

  // ✅ CORREÇÃO: Usar useMemo para criar uma chave estável das referências
  const selectedReferenceIds = useMemo(() => {
    return selectedReferences
      .map(ref => typeof ref === 'object' ? ref.id : ref)
      .filter(id => id !== undefined)
      .sort()
      .join(',');
  }, [selectedReferences]);

  // ✅ CORREÇÃO: useEffect com dependência mais estável
  useEffect(() => {
    if (!onAuthorsFromReferencesChange) return;
    
    const fetchAuthors = async () => {
      if (!selectedReferenceIds) {
        onAuthorsFromReferencesChange([]);
        return;
      }

      try {
        const authorsMap = new Map();
        const referenceIds = selectedReferenceIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

        for (const referenceId of referenceIds) {
          if (!referenceId) continue;

          try {
            const response = await fetch(`${apiUrl.replace('/wizard', '')}/referencias/${referenceId}/autores`);
            if (response.ok) {
              const data = await response.json();
              if (data.autores && Array.isArray(data.autores)) {
                data.autores.forEach((autor: any) => {
                  if (!authorsMap.has(autor.id_autor)) {
                    authorsMap.set(autor.id_autor, {
                      id_autor: autor.id_autor,
                      nome_autor: autor.nome_autor,
                      afiliacao: autor.afiliacao,
                      sigla_afiliacao: autor.sigla_afiliacao,
                      from_reference: true,
                      referencias: [referenceId]
                    });
                  } else {
                    const existingAuthor = authorsMap.get(autor.id_autor);
                    if (!existingAuthor.referencias.includes(referenceId)) {
                      existingAuthor.referencias.push(referenceId);
                    }
                  }
                });
              }
            }
          } catch (error) {
            console.error(`Erro ao buscar autores da referência ${referenceId}:`, error);
          }
        }

        const authorsArray = Array.from(authorsMap.values());
        onAuthorsFromReferencesChange(authorsArray);
        
      } catch (error) {
        console.error('Erro ao buscar autores das referências:', error);
        onAuthorsFromReferencesChange([]);
      }
    };

    fetchAuthors();
  }, [selectedReferenceIds, onAuthorsFromReferencesChange, apiUrl]);

  // Buscar referências existentes
  const searchReferences = async (term: string): Promise<void> => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${apiUrl}/autocomplete/referencias?search=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data: Reference[] = await response.json();
        setSearchResults(data);
        
        // ✅ ATUALIZAR MAPA TAMBÉM NA BUSCA
        setReferencesMap(prev => {
          const newMap = new Map(prev);
          data.forEach(ref => newMap.set(ref.id, ref));
          return newMap;
        });
      } else {
        console.error('Erro na busca:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erro na busca de referências:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchReferences(searchTerm);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, apiUrl]);

  const handleSelectReference = (reference: Reference): void => {
    // ✅ CORREÇÃO: Converter selectedReferences para IDs
    const currentIds = selectedReferences.map(ref => 
      typeof ref === 'object' ? ref.id : ref
    ).filter(id => id !== undefined);
    
    // Verificar se já está selecionada
    const isAlreadySelected = currentIds.includes(reference.id);
    if (isAlreadySelected) {
      return;
    }

    // ✅ ATUALIZAR MAPA PRIMEIRO
    setReferencesMap(prev => {
      const newMap = new Map(prev);
      newMap.set(reference.id, reference);
      return newMap;
    });
    
    // ✅ Adicionar ID à seleção
    const newIds = [...currentIds, reference.id];
    onReferencesChange(newIds);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveReference = (referenceId: number): void => {
    // ✅ CORREÇÃO: Remover ID da seleção
    const currentIds = selectedReferences.map(ref => 
      typeof ref === 'object' ? ref.id : ref
    ).filter(id => id !== undefined);
    
    const newIds = currentIds.filter(id => id !== referenceId);
    onReferencesChange(newIds);
  };

  // ✅ FUNÇÃO CORRIGIDA: Validação baseada no tipo
  const validateNewReference = (): string | null => {
    const { titulo_referencia, link_referencia, tipo_referencia, autores } = newReference;

    // Título sempre obrigatório
    if (!titulo_referencia.trim()) {
      return 'Título é obrigatório para todos os tipos de referência';
    }

    // Pelo menos um autor é obrigatório
    if (autores.length === 0) {
      return 'Pelo menos um autor deve ser adicionado';
    }

    // Validar se todos os autores têm nome
    const autoresSemNome = autores.filter(autor => !autor.nome_autor.trim());
    if (autoresSemNome.length > 0) {
      return 'Todos os autores devem ter nome preenchido';
    }

    // ✅ NOVA LÓGICA: Link obrigatório apenas para URL e Artigo
    if (tipo_referencia === 'URL' || tipo_referencia === 'Artigo') {
      if (!link_referencia.trim()) {
        return `Link é obrigatório para ${tipo_referencia.toLowerCase()}s`;
      }
      // Validar formato da URL
      if (!isValidUrl(link_referencia)) {
        return 'Link deve ser uma URL válida (começar com http:// ou https://)';
      }
    }

    // Para Livro e Tese, link é opcional mas se fornecido deve ser válido
    if ((tipo_referencia === 'Livro' || tipo_referencia === 'Tese') && link_referencia.trim()) {
      if (!isValidUrl(link_referencia)) {
        return 'Se fornecido, o link deve ser uma URL válida';
      }
    }

    return null; // Válido
  };

  const isValidUrl = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const handleCreateReference = async (): Promise<void> => {
    // ✅ VALIDAÇÃO MELHORADA
    const validationError = validateNewReference();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      // ✅ PREPARAR DADOS COM AUTORES
      const referenceData = {
        titulo_referencia: newReference.titulo_referencia.trim(),
        link_referencia: newReference.link_referencia.trim() || '', // Pode ser vazio para livros/teses
        tipo_referencia: newReference.tipo_referencia,
        ano: newReference.ano.trim() || null,
        autores: newReference.autores.map((autor, index) => ({
          id_autor: autor.id_autor,
          nome_autor: autor.nome_autor.trim(),
          afiliacao: autor.afiliacao?.trim() || '',
          sigla_afiliacao: autor.sigla_afiliacao?.trim() || '',
          papel: autor.papel || 'coautor',
          ordem_autor: autor.ordem_autor || index + 1
        }))
      };

      const response = await fetch(`${apiUrl.replace('/wizard', '')}/referencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referenceData)
      });

      if (response.ok) {
        const createdReference: CreatedReferenceResponse = await response.json();
        
        // ✅ Criar objeto de referência para o mapa
        const newReferenceForMap: Reference = {
          id: createdReference.id_referencia,
          label: createdReference.titulo_referencia || createdReference.link_referencia,
          titulo: createdReference.titulo_referencia,
          link: createdReference.link_referencia,
          tipo: createdReference.tipo_referencia,
          ano: createdReference.ano
        };
        
        // ✅ ATUALIZAR MAPA PRIMEIRO
        setReferencesMap(prev => {
          const newMap = new Map(prev);
          newMap.set(createdReference.id_referencia, newReferenceForMap);
          return newMap;
        });
        
        const currentIds = selectedReferences.map(ref => 
          typeof ref === 'object' ? ref.id : ref
        ).filter(id => id !== undefined);
        
        const newIds = [...currentIds, createdReference.id_referencia];
        onReferencesChange(newIds);

        // ✅ LIMPAR FORMULÁRIO COMPLETAMENTE
        setNewReference({
          titulo_referencia: '',
          link_referencia: '',
          tipo_referencia: 'Artigo',
          ano: '',
          autores: []
        });
        
        setMode('select');
        alert(`Referência "${createdReference.titulo_referencia}" criada com sucesso com ${createdReference.autores.length} autores!`);
        
      } else {
        const error: ApiErrorResponse = await response.json();
        alert(`Erro ao criar referência: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao criar referência:', error);
      alert('Erro ao criar referência. Verifique a conexão.');
    }
  };

  const updateNewReference = (field: keyof NewReference, value: any): void => {
    setNewReference(prev => ({ ...prev, [field]: value }));
  };

  // ✅ NOVA FUNÇÃO: Gerenciar autores da nova referência
  const handleAuthorsChange = (authors: Author[]): void => {
    setNewReference(prev => ({ ...prev, autores: authors }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleModeChange = (newMode: 'select' | 'create'): void => {
    setMode(newMode);
    if (newMode === 'select') {
      setSearchTerm('');
      setSearchResults([]);
    } else {
      // Limpar formulário ao entrar no modo criar
      setNewReference({
        titulo_referencia: '',
        link_referencia: '',
        tipo_referencia: 'Artigo',
        ano: '',
        autores: []
      });
    }
  };

  // ✅ CORREÇÃO: Função para obter objeto completo a partir do ID
  const getReferenceById = (id: number): Reference | undefined => {
    // Primeiro tentar do mapa interno
    const fromMap = referencesMap.get(id);
    if (fromMap) return fromMap;
    
    // Depois tentar das referências selecionadas
    const fromSelected = selectedReferences.find(ref => 
      typeof ref === 'object' && ref.id === id
    );
    if (fromSelected) return fromSelected;
    
    // Fallback: criar objeto mínimo
    return { id, label: `ID: ${id}`, link: '', titulo: `Referência ${id}` };
  };

  // ✅ NOVA FUNÇÃO: Determinar se link é obrigatório baseado no tipo
  const isLinkRequired = (tipo: string): boolean => {
    return tipo === 'URL' || tipo === 'Artigo';
  };

  // ✅ NOVA FUNÇÃO: Placeholder para o campo link baseado no tipo
  const getLinkPlaceholder = (tipo: string): string => {
    switch (tipo) {
      case 'URL':
        return 'https://example.com/resource';
      case 'Artigo':
        return 'https://doi.org/10.1016/j.example.2023.01.001';
      case 'Livro':
        return 'https://publisher.com/book (opcional)';
      case 'Tese':
        return 'https://repository.university.edu/thesis (opcional)';
      default:
        return 'https://...';
    }
  };

  return (
    <div className={styles.referenceManager}>
      {/* Referências Selecionadas */}
      {selectedReferences.length > 0 && (
        <div className={styles.selectedReferences}>
          <h4>Referências Selecionadas ({selectedReferences.length})</h4>
          {selectedReferences.map((reference, index) => {
            // ✅ CORREÇÃO: Extrair ID e usar função getReferenceById
            const referenceId = typeof reference === 'object' ? reference.id : reference;
            const displayRef = getReferenceById(referenceId);
            
            if (!displayRef) {
              return null; // Ignorar se não conseguir obter dados
            }
            
            return (
              <div key={`ref-${referenceId}-${index}`} className={styles.selectedReference}>
                <div className={styles.referenceInfo}>
                  <div className={styles.referenceTitle}>
                    {displayRef.titulo || displayRef.label}
                  </div>
                  {displayRef.link && (
                    <div className={styles.referenceLink}>
                      <a href={displayRef.link} target="_blank" rel="noopener noreferrer">
                        {displayRef.link.length > 60 ? displayRef.link.substring(0, 60) + '...' : displayRef.link}
                      </a>
                    </div>
                  )}
                  {displayRef.tipo && displayRef.ano && (
                    <div className={styles.referenceMeta}>
                      {displayRef.tipo} • {displayRef.ano}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveReference(referenceId)}
                  className={styles.removeButton}
                >
                  ×
                </button>
              </div>
            );
          }).filter(Boolean)}
        </div>
      )}

      {/* Modos de Operação */}
      <div className={styles.modeSelector}>
        <button
          type="button"
          onClick={() => handleModeChange('select')}
          className={`${styles.modeButton} ${mode === 'select' ? styles.active : ''}`}
        >
          Selecionar Existente
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('create')}
          className={`${styles.modeButton} ${mode === 'create' ? styles.active : ''}`}
        >
          Criar Nova
        </button>
      </div>

      {/* Modo: Selecionar Referência Existente */}
      {mode === 'select' && (
        <div className={styles.selectMode}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por título, link ou autor..."
              className={styles.searchInput}
            />
            {isSearching && (
              <div className={styles.loadingIndicator}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>

          {/* Resultados da Busca */}
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map((result) => {
                const currentIds = selectedReferences.map(ref => 
                  typeof ref === 'object' ? ref.id : ref
                ).filter(id => id !== undefined);
                
                const isSelected = currentIds.includes(result.id);
                return (
                  <div
                    key={result.id}
                    onClick={() => handleSelectReference(result)}
                    className={`${styles.searchResult} ${isSelected ? styles.alreadySelected : ''}`}
                  >
                    <div className={styles.resultTitle}>
                      {result.titulo || result.label}
                    </div>
                    {result.link && (
                      <div className={styles.resultLink}>
                        {result.link.length > 80 ? result.link.substring(0, 80) + '...' : result.link}
                      </div>
                    )}
                    {result.tipo && result.ano && (
                      <div className={styles.resultMeta}>
                        {result.tipo} • {result.ano}
                      </div>
                    )}
                    {isSelected && (
                      <div className={styles.selectedIndicator}>✓ Já selecionada</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className={styles.noResults}>
              <p>Nenhuma referência encontrada para "{searchTerm}"</p>
              <button
                type="button"
                onClick={() => handleModeChange('create')}
                className={styles.createNewButton}
              >
                Criar Nova Referência
              </button>
            </div>
          )}
        </div>
      )}

      {/* ✅ MODO CRIAR COMPLETAMENTE REFORMULADO */}
      {mode === 'create' && (
        <div className={styles.createMode}>
          <h4>Criar Nova Referência Bibliográfica</h4>
          
          {/* Tipo de Referência */}
          <div className={styles.formGroup}>
            <label className={styles.required}>Tipo de Referência</label>
            <select
              value={newReference.tipo_referencia}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                updateNewReference('tipo_referencia', e.target.value as 'URL' | 'Artigo' | 'Livro' | 'Tese')
              }
              className={styles.select}
            >
              <option value="Artigo">Artigo Científico</option>
              <option value="Livro">Livro</option>
              <option value="Tese">Tese/Dissertação</option>
              <option value="URL">Website/URL</option>
            </select>
          </div>

          {/* Título da Referência */}
          <div className={styles.formGroup}>
            <label className={styles.required}>Título da Referência</label>
            <input
              type="text"
              value={newReference.titulo_referencia}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                updateNewReference('titulo_referencia', e.target.value)
              }
              placeholder={
                newReference.tipo_referencia === 'Artigo' ? 'Título do artigo científico' :
                newReference.tipo_referencia === 'Livro' ? 'Título do livro' :
                newReference.tipo_referencia === 'Tese' ? 'Título da tese ou dissertação' :
                'Nome do recurso ou página'
              }
              className={styles.input}
            />
          </div>

          {/* ✅ Link da Referência - LÓGICA CORRIGIDA */}
          <div className={styles.formGroup}>
            <label className={isLinkRequired(newReference.tipo_referencia) ? styles.required : ''}>
              {newReference.tipo_referencia === 'URL' ? 'URL' :
               newReference.tipo_referencia === 'Artigo' ? 'DOI ou Link do Artigo' :
               newReference.tipo_referencia === 'Livro' ? 'Link do Livro (opcional)' :
               'Link da Tese (opcional)'}
            </label>
            <input
              type="url"
              value={newReference.link_referencia}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                updateNewReference('link_referencia', e.target.value)
              }
              placeholder={getLinkPlaceholder(newReference.tipo_referencia)}
              className={styles.input}
            />
            {!isLinkRequired(newReference.tipo_referencia) && (
              <small className={styles.helpText}>
                ℹ️ Link é opcional para {newReference.tipo_referencia.toLowerCase()}s
              </small>
            )}
          </div>

          {/* Ano */}
          <div className={styles.formGroup}>
            <label>Ano de Publicação</label>
            <input
              type="number"
              min="1900"
              max="2030"
              value={newReference.ano}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                updateNewReference('ano', e.target.value)
              }
              placeholder="2023"
              className={styles.input}
            />
          </div>

          {/* ✅ SEÇÃO DE AUTORES USANDO AuthorManager */}
          <div className={styles.formGroup}>
            <label className={styles.required}>Autores da Referência</label>
            <p className={styles.helpText}>
              Adicione pelo menos um autor para esta referência bibliográfica.
            </p>
            <AuthorManager
              authors={newReference.autores}
              onAuthorsChange={handleAuthorsChange}
              apiUrl={apiUrl}
              showRoles={true}
              allowReordering={true}
            />
          </div>

          {/* ✅ RESUMO DA REFERÊNCIA */}
          {(newReference.titulo_referencia || newReference.autores.length > 0) && (
            <div className={styles.referenceSummary}>
              <h5>Prévia da Referência:</h5>
              <div className={styles.summaryContent}>
                {newReference.titulo_referencia && (
                  <div><strong>Título:</strong> {newReference.titulo_referencia}</div>
                )}
                {newReference.autores.length > 0 && (
                  <div><strong>Autores:</strong> {newReference.autores.map(a => a.nome_autor).join(', ')}</div>
                )}
                <div><strong>Tipo:</strong> {newReference.tipo_referencia}</div>
                {newReference.ano && (
                  <div><strong>Ano:</strong> {newReference.ano}</div>
                )}
                {newReference.link_referencia && (
                  <div><strong>Link:</strong> <a href={newReference.link_referencia} target="_blank" rel="noopener noreferrer">
                    {newReference.link_referencia.length > 50 ? newReference.link_referencia.substring(0, 50) + '...' : newReference.link_referencia}
                  </a></div>
                )}
              </div>
            </div>
          )}

          {/* Ações de Criação */}
          <div className={styles.createActions}>
            <button
              type="button"
              onClick={handleCreateReference}
              className={styles.createButton}
              disabled={!newReference.titulo_referencia.trim() || newReference.autores.length === 0}
            >
              Criar e Adicionar Referência
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('select')}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceBibliographyManager;