import React, { useState, useEffect, useRef } from 'react';
import styles from './AutocompleteSelect.module.css';

// Interfaces TypeScript
interface AutocompleteItem {
  id: number;
  label: string;
  nome?: string;
  afiliacao?: string;
  [key: string]: any;
}

interface AutocompleteSelectProps {
  placeholder?: string;
  searchEndpoint: string;
  selectedItems?: AutocompleteItem[];
  onSelectionChange: (items: number[]) => void; // ✅ Recebe array de IDs
  displayField?: string;
  maxItems?: number;
  disabled?: boolean;
}

const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({ 
  placeholder = "Buscar...", 
  searchEndpoint, 
  selectedItems = [], 
  onSelectionChange, 
  displayField = "label",
  maxItems = 5,
  disabled = false 
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Estado interno para mapear IDs -> objetos completos (para display)
  const [itemsMap, setItemsMap] = useState<Map<number, AutocompleteItem>>(new Map());

  // ✅ CORREÇÃO: Inicializar mapa com itens já selecionados
  useEffect(() => {
    if (selectedItems.length > 0) {
      setItemsMap(prev => {
        const newMap = new Map(prev);
        selectedItems.forEach(item => {
          if (item && item.id) {
            newMap.set(item.id, item);
          }
        });
        return newMap;
      });
    }
  }, [selectedItems]);

  // Buscar sugestões quando o termo de busca muda
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce da busca
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${searchEndpoint}?search=${encodeURIComponent(searchTerm)}&limit=${maxItems}`);
        if (response.ok) {
          const data: AutocompleteItem[] = await response.json();
          setSuggestions(data);
          
          // ✅ Atualizar mapa interno sem triggerar re-renders desnecessários
          setItemsMap(prev => {
            const newMap = new Map(prev);
            data.forEach(item => {
              if (item && item.id) {
                newMap.set(item.id, item);
              }
            });
            return newMap;
          });
        }
      } catch (error) {
        console.error('Erro no autocomplete:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    // Cleanup do timeout
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, searchEndpoint, maxItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectItem = (item: AutocompleteItem) => {
    // ✅ CORREÇÃO: Converter selectedItems para IDs
    const currentIds = selectedItems.map(selectedItem => selectedItem.id).filter(id => id !== undefined);
    
    // Verificar se já está selecionado
    const isAlreadySelected = currentIds.includes(item.id);
    if (isAlreadySelected) {
      return;
    }

    // ✅ Adicionar ID à seleção e atualizar mapa
    const newIds = [...currentIds, item.id];
    
    // Atualizar mapa primeiro
    setItemsMap(prev => {
      const newMap = new Map(prev);
      newMap.set(item.id, item);
      return newMap;
    });
    
    onSelectionChange(newIds); // ✅ ENVIAR APENAS IDs

    // Limpar busca
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRemoveItem = (itemId: number) => {
    // ✅ CORREÇÃO: Remover ID da seleção
    const currentIds = selectedItems.map(selectedItem => selectedItem.id).filter(id => id !== undefined);
    const newIds = currentIds.filter(id => id !== itemId);
    onSelectionChange(newIds); // ✅ ENVIAR APENAS IDs
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay para permitir cliques nas sugestões
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // ✅ CORREÇÃO: Função para obter objeto completo a partir do ID
  const getItemById = (id: number): AutocompleteItem | undefined => {
    // Primeiro tentar do mapa interno
    const fromMap = itemsMap.get(id);
    if (fromMap) return fromMap;
    
    // Depois tentar dos itens selecionados
    const fromSelected = selectedItems.find(item => item.id === id);
    if (fromSelected) return fromSelected;
    
    // Fallback: criar objeto mínimo
    return { id, label: `ID: ${id}`, nome: `Item ${id}` };
  };

  return (
    <div className={styles.autocompleteContainer}>
      {/* Itens Selecionados */}
      {selectedItems.length > 0 && (
        <div className={styles.selectedItems}>
          {selectedItems.map((item) => {
            // ✅ CORREÇÃO: Usar função getItemById para garantir dados completos
            const displayItem = getItemById(item.id);
            
            if (!displayItem) {
              return null; // Ignorar se não conseguir obter dados
            }
            
            return (
              <div key={`selected-${item.id}`} className={styles.selectedItem}>
                <span className={styles.itemText}>
                  {displayItem[displayField] || displayItem.label || displayItem.nome || `ID: ${displayItem.id}`}
                </span>
                {displayItem.afiliacao && (
                  <span className={styles.itemSubtext}>
                    ({displayItem.afiliacao})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className={styles.removeButton}
                  disabled={disabled}
                >
                  ×
                </button>
              </div>
            );
          }).filter(Boolean)}
        </div>
      )}

      {/* Input de Busca */}
      <div className={styles.searchContainer}>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={styles.searchInput}
          disabled={disabled}
        />
        
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestionsContainer}>
          {suggestions.map((suggestion) => {
            const currentIds = selectedItems.map(selectedItem => selectedItem.id).filter(id => id !== undefined);
            const isSelected = currentIds.includes(suggestion.id);
            
            return (
              <div
                key={`suggestion-${suggestion.id}`}
                onClick={() => handleSelectItem(suggestion)}
                className={`${styles.suggestionItem} ${isSelected ? styles.alreadySelected : ''}`}
              >
                <div className={styles.suggestionText}>
                  {suggestion[displayField] || suggestion.label || suggestion.nome || `ID: ${suggestion.id}`}
                </div>
                {suggestion.afiliacao && (
                  <div className={styles.suggestionSubtext}>
                    {suggestion.afiliacao}
                  </div>
                )}
                {isSelected && (
                  <div className={styles.selectedIndicator}>✓ Já selecionado</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Estado vazio */}
      {showSuggestions && searchTerm.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className={styles.noResults}>
          Nenhum resultado encontrado para "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default AutocompleteSelect;