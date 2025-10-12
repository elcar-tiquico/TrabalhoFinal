import React, { useState, useEffect, useRef } from 'react';
import styles from './AuthorManager.module.css';

// Interfaces TypeScript
interface Author {
  id_autor?: number;
  nome_autor: string;
  afiliacao?: string;
  sigla_afiliacao?: string;
  papel?: 'primeiro' | 'correspondente' | 'coautor';
  ordem_autor?: number;
  isNew?: boolean;
}

interface ExistingAuthor {
  id: number;
  nome: string;
  afiliacao?: string;
  sigla_afiliacao?: string;
  label: string;
}

interface AuthorManagerProps {
  authors: Author[];
  onAuthorsChange: (authors: Author[]) => void;
  apiUrl: string;
  disabled?: boolean;
  showRoles?: boolean;
  allowReordering?: boolean;
}

const AuthorManager: React.FC<AuthorManagerProps> = ({
  authors,
  onAuthorsChange,
  apiUrl,
  disabled = false,
  showRoles = true,
  allowReordering = true
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ExistingAuthor[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Buscar autores existentes
  const searchAuthors = async (term: string): Promise<void> => {
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/autocomplete/autores?search=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data: ExistingAuthor[] = await response.json();
        setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Erro na busca de autores:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchAuthors(searchTerm);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, apiUrl]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  // ✅ CORREÇÃO DO BUG: Função corrigida para adicionar autor existente
  const handleSelectExistingAuthor = (existingAuthor: ExistingAuthor): void => {
    // Verificar se o autor já está na lista
    const isAlreadyAdded = authors.some(author => 
      author.id_autor === existingAuthor.id || 
      (author.nome_autor.toLowerCase() === existingAuthor.nome.toLowerCase() && 
       author.afiliacao?.toLowerCase() === existingAuthor.afiliacao?.toLowerCase())
    );

    if (isAlreadyAdded) {
      console.log('Autor já adicionado:', existingAuthor.nome);
      return;
    }

    const newAuthor: Author = {
      id_autor: existingAuthor.id,
      nome_autor: existingAuthor.nome,
      afiliacao: existingAuthor.afiliacao || '',
      sigla_afiliacao: existingAuthor.sigla_afiliacao || '',
      papel: 'coautor',
      ordem_autor: authors.length + 1,
      isNew: false
    };

    // ✅ CORREÇÃO: Chamar onAuthorsChange diretamente com novo array
    const updatedAuthors = [...authors, newAuthor];
    onAuthorsChange(updatedAuthors);
    
    // Limpar busca
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    console.log('Autor adicionado com sucesso:', newAuthor);
  };

  const handleCreateNewAuthor = (): void => {
    if (!searchTerm.trim()) return;

    // Verificar se já existe um autor com o mesmo nome
    const isAlreadyAdded = authors.some(author => 
      author.nome_autor.toLowerCase() === searchTerm.trim().toLowerCase()
    );

    if (isAlreadyAdded) {
      console.log('Autor com mesmo nome já existe:', searchTerm);
      return;
    }

    const newAuthor: Author = {
      nome_autor: searchTerm.trim(),
      afiliacao: '',
      sigla_afiliacao: '',
      papel: 'coautor',
      ordem_autor: authors.length + 1,
      isNew: true
    };

    // ✅ CORREÇÃO: Chamar onAuthorsChange diretamente
    const updatedAuthors = [...authors, newAuthor];
    onAuthorsChange(updatedAuthors);
    
    // Limpar busca
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Entrar em modo de edição para o novo autor
    setEditingIndex(authors.length);
    
    console.log('Novo autor criado:', newAuthor);
  };

  const handleRemoveAuthor = (index: number): void => {
    const newAuthors = authors.filter((_, i) => i !== index);
    const reorderedAuthors = newAuthors.map((author, i) => ({
      ...author,
      ordem_autor: i + 1
    }));
    onAuthorsChange(reorderedAuthors);
  };

  const handleUpdateAuthor = (index: number, field: keyof Author, value: string): void => {
    const newAuthors = [...authors];
    newAuthors[index] = { ...newAuthors[index], [field]: value };
    onAuthorsChange(newAuthors);
  };

  const handleMoveAuthor = (index: number, direction: 'up' | 'down'): void => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === authors.length - 1)) {
      return;
    }

    const newAuthors = [...authors];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newAuthors[index], newAuthors[targetIndex]] = [newAuthors[targetIndex], newAuthors[index]];
    
    newAuthors.forEach((author, i) => {
      author.ordem_autor = i + 1;
    });

    onAuthorsChange(newAuthors);
  };

  // ✅ CORREÇÃO: Verificação melhorada para autor já adicionado
  const isAuthorAlreadyAdded = (existingAuthor: ExistingAuthor): boolean => {
    return authors.some(author => 
      author.id_autor === existingAuthor.id || 
      (author.nome_autor.toLowerCase() === existingAuthor.nome.toLowerCase() && 
       author.afiliacao?.toLowerCase() === existingAuthor.afiliacao?.toLowerCase())
    );
  };

  const getRoleLabel = (papel: string): string => {
    switch (papel) {
      case 'primeiro': return 'Primeiro autor';
      case 'correspondente': return 'Correspondente';
      case 'coautor': return 'Coautor';
      default: return 'Coautor';
    }
  };

  const getRoleColor = (papel: string): string => {
    switch (papel) {
      case 'primeiro': return '#667eea';
      case 'correspondente': return '#f59e0b';
      case 'coautor': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // ✅ CORREÇÃO: Função para fechar sugestões com delay
  const handleInputBlur = (): void => {
    // Delay para permitir clique nas sugestões
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className={styles.authorManager}>
      {/* Lista de Autores */}
      {authors.length > 0 && (
        <div className={styles.authorsList}>
          <h4>Autores ({authors.length})</h4>
          {authors.map((author, index) => (
            <div key={`author-${index}-${author.id_autor || author.nome_autor}`} className={styles.authorItem}>
              <div className={styles.authorOrder}>{index + 1}</div>
              
              <div className={styles.authorContent}>
                {editingIndex === index ? (
                  <div className={styles.authorEdit}>
                    <div className={styles.editRow}>
                      <input
                        type="text"
                        value={author.nome_autor}
                        onChange={(e) => handleUpdateAuthor(index, 'nome_autor', e.target.value)}
                        placeholder="Nome do autor"
                        className={styles.editInput}
                      />
                    </div>
                    <div className={styles.editRow}>
                      <input
                        type="text"
                        value={author.afiliacao || ''}
                        onChange={(e) => handleUpdateAuthor(index, 'afiliacao', e.target.value)}
                        placeholder="Afiliação (opcional)"
                        className={styles.editInput}
                      />
                      <input
                        type="text"
                        value={author.sigla_afiliacao || ''}
                        onChange={(e) => handleUpdateAuthor(index, 'sigla_afiliacao', e.target.value)}
                        placeholder="Sigla"
                        className={styles.editInput}
                        style={{ maxWidth: '120px' }}
                      />
                    </div>
                    {showRoles && (
                      <div className={styles.editRow}>
                        <select
                          value={author.papel || 'coautor'}
                          onChange={(e) => handleUpdateAuthor(index, 'papel', e.target.value)}
                          className={styles.editSelect}
                        >
                          <option value="primeiro">Primeiro autor</option>
                          <option value="correspondente">Correspondente</option>
                          <option value="coautor">Coautor</option>
                        </select>
                      </div>
                    )}
                    <div className={styles.editActions}>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className={styles.saveButton}
                      >
                        ✓ Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.authorDisplay}>
                    <div className={styles.authorName}>
                      {author.nome_autor}
                      {author.isNew && <span className={styles.newTag}>Novo</span>}
                    </div>
                    {author.afiliacao && (
                      <div className={styles.authorAffiliation}>
                        {author.afiliacao}
                        {author.sigla_afiliacao && ` (${author.sigla_afiliacao})`}
                      </div>
                    )}
                    {showRoles && author.papel && (
                      <div 
                        className={styles.authorRole}
                        style={{ color: getRoleColor(author.papel) }}
                      >
                        {getRoleLabel(author.papel)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.authorActions}>
                {editingIndex !== index && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(index)}
                      className={styles.actionButton}
                      title="Editar"
                      disabled={disabled}
                    >
                      ✏️
                    </button>
                    {allowReordering && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMoveAuthor(index, 'up')}
                          disabled={index === 0 || disabled}
                          className={styles.actionButton}
                          title="Mover para cima"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveAuthor(index, 'down')}
                          disabled={index === authors.length - 1 || disabled}
                          className={styles.actionButton}
                          title="Mover para baixo"
                        >
                          ↓
                        </button>
                      </>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveAuthor(index)}
                  className={styles.removeButton}
                  title="Remover"
                  disabled={disabled}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Busca e Adição de Autores */}
      {!disabled && (
        <div className={styles.addAuthorSection}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleInputBlur}
              placeholder="Buscar autor existente ou escrever nome de novo autor..."
              className={styles.searchInput}
            />
            
            {isLoading && (
              <div className={styles.loadingIndicator}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>

          {/* ✅ CORREÇÃO: Sugestões com clique funcionando */}
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((suggestion) => {
                const isAlreadyAdded = isAuthorAlreadyAdded(suggestion);
                return (
                  <div
                    key={`suggestion-${suggestion.id}`}
                    onMouseDown={(e) => {
                      // ✅ CORREÇÃO: Usar onMouseDown em vez de onClick para evitar conflito com onBlur
                      e.preventDefault();
                      if (!isAlreadyAdded) {
                        handleSelectExistingAuthor(suggestion);
                      }
                    }}
                    className={`${styles.suggestion} ${isAlreadyAdded ? styles.disabled : ''}`}
                    style={{ cursor: isAlreadyAdded ? 'not-allowed' : 'pointer' }}
                  >
                    <div className={styles.suggestionName}>{suggestion.nome}</div>
                    {suggestion.afiliacao && (
                      <div className={styles.suggestionAffiliation}>
                        {suggestion.afiliacao}
                        {suggestion.sigla_afiliacao && ` (${suggestion.sigla_afiliacao})`}
                      </div>
                    )}
                    {isAlreadyAdded && (
                      <div className={styles.alreadyAddedTag}>Já adicionado</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Opção de Criar Novo Autor */}
          {searchTerm.length >= 2 && (
            <div className={styles.createNewOption}>
              <button
                type="button"
                onClick={handleCreateNewAuthor}
                className={styles.createNewButton}
                disabled={authors.some(author => author.nome_autor.toLowerCase() === searchTerm.trim().toLowerCase())}
              >
                + Criar novo autor: "{searchTerm}"
              </button>
            </div>
          )}

          {/* Ajuda */}
          {authors.length === 0 && (
            <div className={styles.helpText}>
              <p>Digite o nome de um autor para buscar autores existentes ou criar um novo.</p>
              {showRoles && (
                <div className={styles.roleHelp}>
                  <p><strong>Tipos de autor:</strong></p>
                  <ul>
                    <li>
                      <span style={{color: getRoleColor('primeiro')}}>●</span> 
                      <strong>Primeiro autor:</strong> Autor principal do trabalho
                    </li>
                    <li>
                      <span style={{color: getRoleColor('correspondente')}}>●</span> 
                      <strong>Correspondente:</strong> Autor para correspondência
                    </li>
                    <li>
                      <span style={{color: getRoleColor('coautor')}}>●</span> 
                      <strong>Coautor:</strong> Autor colaborador
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthorManager;