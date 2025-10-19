"use client";
import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import Link from 'next/link';

// Interfaces TypeScript (mantidas iguais)
interface NomeComumDetalhado {
  id_nome: number;
  nome_comum: string;
  nome?: string;
}

interface ProvinciaDetalhada {
  id_provincia: number;
  nome_provincia: string;
  local?: string;
}

interface UsoEspecifico {
  id_parte: number;
  nome_parte: string;
  indicacoes: Array<{
    id_indicacao: number;
    descricao: string;
  }>;
}

interface AutorDetalhado {
  id_autor: number;
  nome_autor: string;
  afiliacao?: string;
}

interface ReferenciaDetalhada {
  id_referencia: number;
  titulo?: string;
  link?: string;
  ano?: string | number;
  autores: Array<{
    id_autor: number;
    nome_autor: string;
  }>;
}

interface ImagemPlanta {
  id_imagem: number;
  nome_arquivo: string;
  url: string;
  legenda?: string;
}

interface PlantaDetalhadaDashboard {
  id_planta: number;
  nome_cientifico: string;
  familia: {
    nome_familia: string;
  };
  numero_exsicata?: string;
  infos_adicionais?: string;
  comp_quimica?: string;
  prop_farmacologica?: string;
  data_adicao?: string;
  
  nomes_comuns: NomeComumDetalhado[];
  provincias: ProvinciaDetalhada[];
  usos_especificos: UsoEspecifico[];
  partes_usadas: UsoEspecifico[];  // Alias
  autores: AutorDetalhado[];
  referencias_especificas: ReferenciaDetalhada[];
  referencias: ReferenciaDetalhada[];  // Alias
  imagens: ImagemPlanta[];
  
  metadata?: {
    total_nomes_comuns: number;
    total_provincias: number;
    total_usos: number;
    total_autores: number;
    total_referencias: number;
    total_imagens: number;
    tem_comp_quimica: boolean;
    tem_prop_farmacologica: boolean;
  };
}

interface StatItem {
  value: number;
  change: string;
  change_type: 'increase' | 'decrease' | 'stable';
}

interface DashboardStats {
  total_plantas: StatItem;
  total_familias: StatItem;
  idiomas_disponiveis: StatItem;
  pesquisas_realizadas: StatItem;
}

interface FamiliaData {
  name: string;
  count: number;
  percentage: number;
}

interface ProvinciaData {
  name: string;
  count: number;
  percentage: number;
}

interface PlantaRecente {
  id: number;
  name: string;
  all_names?: string[];  // ✅ NOVO: Lista completa de nomes
  names_count?: number;  // ✅ NOVO: Número total de nomes
  scientific_name: string;
  family: string;
  exsicata: string;
  added_at: string;
}

interface IdiomaData {
  language: string;
  count: number;
  percentage: number;
}

interface ReferenciaStats {
  total_referencias: number;
  referencias_com_plantas: number;
  referencias_sem_ano: number;
  tipos: Array<{ tipo: string; count: number }>;
  por_ano: Array<{ ano: string; count: number }>;
  mais_utilizadas: Array<{
    id: number;
    titulo: string;
    tipo: string;
    ano: string;
    total_plantas: number;
  }>;
}

interface AutorStats {
  total_autores: number;
  autores_com_plantas: number;
  autores_sem_afiliacao: number;
  total_afiliacoes: number;
  mais_produtivos: Array<{
    id: number;
    nome: string;
    afiliacao: string;
    sigla: string;
    total_plantas: number;
  }>;
  por_afiliacao: Array<{
    afiliacao: string;
    total_autores: number;
    total_plantas: number;
  }>;
}

interface ReferenciaRecente {
  id: number;
  titulo: string;
  tipo: string;
  ano: string;
  link: string;
  total_plantas: number;
  autores: string[];
}

interface AutorRecente {
  id: number;
  nome: string;
  afiliacao: string;
  sigla: string;
  total_plantas: number;
  total_referencias: number;
}

// ===== NOVAS INTERFACES PARA PESQUISAS =====
interface SearchStats {
  total_cliques: number;
  cliques_hoje: number;
  plantas_unicas_clicadas: number;
  dados_disponiveis: boolean;
  metrica: string;
  top_plantas_clicadas: Array<{
    termo: string;
    tipo_busca: string;
    total_cliques: number;
  }>;
  interesse_por_tipo: Array<{
    tipo_busca: string;
    total_cliques: number;
    percentual: number;
  }>;
  primeiro_clique: string | null;
  ultimo_clique: string | null;
}

interface SearchDetailed {
  resumo: {
    total_pesquisas: number;
    pesquisas_com_resultado: number;
    pesquisas_sem_resultado: number;
    taxa_sucesso: number;
    media_resultados: number;
  };
  top_termos: Array<{
    termo: string;
    total: number;
    percentual: number;
  }>;
  por_tipo: Array<{
    tipo: string;
    total: number;
    percentual: number;
  }>;
}

// Helper para toUpperCase seguro
const safeUpper = (value: any): string => {
  if (!value) return 'Não informado';
  return String(value).toUpperCase();
};

// Componente principal
const AdminDashboardComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados existentes para dados REAIS da API
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [plantasPorFamilia, setPlantasPorFamilia] = useState<FamiliaData[]>([]);
  const [plantasPorProvincia, setPlantasPorProvincia] = useState<ProvinciaData[]>([]);
  const [plantasRecentes, setPlantasRecentes] = useState<PlantaRecente[]>([]);
  const [plantasPorIdioma, setPlantasPorIdioma] = useState<IdiomaData[]>([]);
  const [referenciaStats, setReferenciaStats] = useState<ReferenciaStats | null>(null);
  const [autorStats, setAutorStats] = useState<AutorStats | null>(null);
  const [referenciasRecentes, setReferenciasRecentes] = useState<ReferenciaRecente[]>([]);
  const [autoresRecentes, setAutoresRecentes] = useState<AutorRecente[]>([]);

  // ===== NOVOS ESTADOS PARA PESQUISAS =====
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [searchDetailed, setSearchDetailed] = useState<SearchDetailed | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const [selectedPlanta, setSelectedPlanta] = useState<PlantaDetalhadaDashboard | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [loadingModal, setLoadingModal] = useState<boolean>(false);

  const isManageableFamily = (familyName: string): boolean => {
    const normalizedName = familyName.toLowerCase().trim()
    const nonManageableNames = [
      'outras', 
      'outros', 
      'other', 
      'others',
      'várias',
      'diversas',
      'não classificada',
      'não classificadas',
      'sem família'
    ]
    
    return !nonManageableNames.includes(normalizedName)
  }

  const API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5000/api/admin/dashboard';
  const MAIN_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // ADICIONAR estes novos estados após os existentes:
  //const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [viewModalType, setViewModalType] = useState<'autor' | 'referencia' | 'planta' | null>(null);
  const [selectedViewItem, setSelectedViewItem] = useState<any>(null);

  // ===== FUNÇÃO PARA FORMATAR NOMES DE FAMÍLIAS =====
  const formatarNomeFamilia = (nomeFamilia: any): string => {
    return safeUpper(nomeFamilia);
  };

  // ===== NOVA FUNÇÃO PARA BUSCAR DADOS DE PESQUISA =====
  const fetchSearchData = async (): Promise<void> => {
    try {
      setSearchLoading(true);

      console.log('🔍 Carregando dados de pesquisa...');

      // Fazer chamadas paralelas para dados de pesquisa
      const [
        searchStatsResponse,
        searchDetailedResponse
      ] = await Promise.all([
        fetch(`${MAIN_API_URL}/pesquisas/stats`),
        fetch(`${API_BASE_URL}/pesquisas-detalhadas`)
      ]);

      // Parse das respostas
      const [searchStatsData, searchDetailedData] = await Promise.all([
        searchStatsResponse.ok ? searchStatsResponse.json() : null,
        searchDetailedResponse.ok ? searchDetailedResponse.json() : null
      ]);

      setSearchStats(searchStatsData);
      setSearchDetailed(searchDetailedData);

      console.log('✅ Dados de pesquisa carregados:', {
        stats: searchStatsData?.total_cliques || 0,
        detailed: searchDetailedData?.resumo?.total_pesquisas || 0
      });

    } catch (error) {
      console.error('❌ Erro ao carregar dados de pesquisa:', error);
      // Não definir como erro crítico - pesquisas são opcionais
    } finally {
      setSearchLoading(false);
    }
  };

  // Função helper para extrair valor numérico de forma segura
  const getStatValue = (stat: StatItem | number | undefined): number => {
    if (!stat) return 0;
    if (typeof stat === 'number') return stat;
    return stat.value || 0;
  };

  // Função para fazer fetch dos dados REAIS da API (existente)
  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Carregando dados REAIS da API:', API_BASE_URL);

      // Fazer todas as chamadas da API REAL em paralelo
      const [
        statsResponse,
        familiasResponse,
        provinciasResponse,
        recentesResponse,
        idiomasResponse,
        referenciaStatsResponse,
        autorStatsResponse,
        referenciasRecentesResponse,
        autoresRecentesResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`),
        fetch(`${API_BASE_URL}/plantas-por-familia?limit=6`),
        fetch(`${API_BASE_URL}/plantas-por-provincia`),
        fetch(`${API_BASE_URL}/plantas-recentes?limit=5`),
        fetch(`${API_BASE_URL}/plantas-por-idioma`),
        fetch(`${API_BASE_URL}/referencias-stats`),
        fetch(`${API_BASE_URL}/autores-stats`),
        fetch(`${API_BASE_URL}/referencias-recentes?limit=5`),
        fetch(`${API_BASE_URL}/autores-recentes?limit=5`)
      ]);

      // Verificar se todas as respostas foram bem-sucedidas
      const responses = [
        statsResponse, familiasResponse, provinciasResponse, recentesResponse,
        idiomasResponse, referenciaStatsResponse, autorStatsResponse,
        referenciasRecentesResponse, autoresRecentesResponse
      ];

      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          throw new Error(`Erro na API: ${responses[i].status} - ${responses[i].statusText}`);
        }
      }

      // Parse das respostas JSON
      const [
        statsData,
        familiasData,
        provinciasData,
        recentesData,
        idiomasData,
        referenciaStatsData,
        autorStatsData,
        referenciasRecentesData,
        autoresRecentesData
      ] = await Promise.all([
        statsResponse.json(),
        familiasResponse.json(),
        provinciasResponse.json(),
        recentesResponse.json(),
        idiomasResponse.json(),
        referenciaStatsResponse.json(),
        autorStatsResponse.json(),
        referenciasRecentesResponse.json(),
        autoresRecentesResponse.json()
      ]);

      // Atualizar todos os estados com dados REAIS
      setStats(statsData);
      
      // Aplicar formatação de maiúsculas nas famílias
      if (familiasData.familias) {
        console.log('🔍 Dados de famílias recebidos da API:', familiasData.familias);
        
        // Calcular total de plantas
        const totalPlantas = familiasData.familias.reduce((sum: number, f: any) => sum + f.count, 0);
        
        const familiasFormatadas = familiasData.familias.map((familia: any) => ({
          ...familia,
          name: formatarNomeFamilia(familia.name),
          percentage: totalPlantas > 0 ? Math.round((familia.count / totalPlantas) * 100 * 10) / 10 : 0  // ✅ CALCULAR PERCENTUAL
        }));
        
        console.log('✅ Famílias formatadas:', familiasFormatadas);
        setPlantasPorFamilia(familiasFormatadas);
      } else {
        setPlantasPorFamilia([]);
      }
      
      // Recalcular percentual baseado em plantas únicas
// Recalcular percentual baseado em plantas únicas
if (provinciasData.provincias) {
  console.log('📍 Dados de províncias recebidos:', provinciasData.provincias);
  
  // ✅ CORREÇÃO: Usar statsData PARSEADO (não o estado stats)
  const totalPlantasNoSistema = statsData?.total_plantas?.value || 
                                 statsData?.total_plantas || 
                                 3;  // fallback seguro
  
  console.log('🌍 Total de plantas no sistema:', totalPlantasNoSistema);
  console.log('📊 statsData completo:', statsData);
  
  const provinciasCorrigidas = provinciasData.provincias.map((provincia: any) => {
    const plantasUnicas = provincia.total_plantas_unicas || provincia.count;
    const percentualCorreto = totalPlantasNoSistema > 0 
      ? (plantasUnicas / totalPlantasNoSistema * 100) 
      : 0;
    
    console.log(`📊 Província ${provincia.name}: ${plantasUnicas} plantas = ${percentualCorreto.toFixed(1)}%`);
    
    return {
      name: provincia.name,
      count: plantasUnicas,
      percentage: Math.round(percentualCorreto * 10) / 10
    };
  });
  
  console.log('✅ Províncias formatadas:', provinciasCorrigidas);
  
  provinciasCorrigidas.sort((a: { count: number; }, b: { count: number; }) => b.count - a.count);
  setPlantasPorProvincia(provinciasCorrigidas);
} else {
  setPlantasPorProvincia([]);
}
      
      // ✅ BUSCAR NOMES COMPLETOS PARA PLANTAS RECENTES
        // ✅ BUSCAR NOMES COMPLETOS PARA PLANTAS RECENTES
      if (recentesData.plantas_recentes) {
        console.log('🔄 Buscando nomes completos para plantas recentes...');
        console.log('📦 Dados recebidos:', recentesData.plantas_recentes);
        
        // Construir URL correta para a API de plantas
        const plantasApiUrl = API_BASE_URL.includes('/dashboard') 
          ? API_BASE_URL.replace('/api/admin/dashboard', '/api/admin/plantas')
          : `${API_BASE_URL.split('/api')[0]}/api/admin/plantas`;
        
        console.log('🔗 URL da API de plantas:', plantasApiUrl);
        
        const plantasComNomes = await Promise.all(
          recentesData.plantas_recentes.map(async (planta: any) => {
            console.log(`🔍 Buscando planta ID ${planta.id}...`);
            try {
              const response = await fetch(`${plantasApiUrl}/${planta.id}`);
              console.log(`📡 Response status para planta ${planta.id}:`, response.status);
              
              if (response.ok) {
                const plantaCompleta = await response.json();
                console.log(`✅ Planta ${planta.id} completa:`, plantaCompleta);
                
                console.log('🧪 Estrutura de nomes_comuns:', plantaCompleta.nomes_comuns);
                const todosNomes = plantaCompleta.nomes_comuns?.map((n: any) => {
                  console.log('🔍 Nome individual:', n);
                  return n.nome_comum || n.nome || n;
                }) || [planta.name];
                console.log(`📝 Nomes encontrados para planta ${planta.id}:`, todosNomes);
                
                
                return {
                  ...planta,
                  family: formatarNomeFamilia(planta.family),
                  all_names: todosNomes,
                  names_count: todosNomes.length
                };
              }
            } catch (error) {
              console.error(`❌ Erro ao buscar nomes da planta ${planta.id}:`, error);
            }
            
            // Fallback: se falhar, retorna com dados básicos
            console.log(`⚠️ Usando fallback para planta ${planta.id}`);
            return {
              ...planta,
              family: formatarNomeFamilia(planta.family),
              all_names: [planta.name],
              names_count: 1
            };
          })
        );
        
        console.log('✅ Nomes completos carregados:', plantasComNomes);
        setPlantasRecentes(plantasComNomes);
      } else {
        console.log('❌ Nenhuma planta recente encontrada');
        setPlantasRecentes([]);
      }
      
      setPlantasPorIdioma(idiomasData.idiomas || []);

      // Garantir que os dados de referências e autores nunca sejam null/undefined
      setReferenciaStats(referenciaStatsData || {
        total_referencias: 0,
        referencias_com_plantas: 0,
        referencias_sem_ano: 0,
        tipos: [],
        por_ano: [],
        mais_utilizadas: []
      });

      setAutorStats(autorStatsData || {
        total_autores: 0,
        autores_com_plantas: 0,
        autores_sem_afiliacao: 0,
        total_afiliacoes: 0,
        mais_produtivos: [],
        por_afiliacao: []
      });

      setReferenciasRecentes(referenciasRecentesData?.referencias_recentes || []);
      setAutoresRecentes(autoresRecentesData?.autores_recentes || []);

      console.log('✅ Dados REAIS carregados com sucesso:', {
        stats: statsData,
        familias: familiasData.familias?.length || 0,
        provincias: provinciasData.provincias?.length || 0,
        plantasRecentes: recentesData.plantas_recentes?.length || 0,
        idiomas: idiomasData.idiomas?.length || 0,
        referencias: referenciaStatsData.total_referencias || 0,
        autores: autorStatsData.total_autores || 0
      });

      // Carregar dados de pesquisa após dados principais
      await fetchSearchData();

    } catch (error) {
      console.error('❌ Erro ao carregar dados da API:', error);
      setError(`Erro ao conectar com a API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      setStats(null);
      setPlantasPorFamilia([]);
      setPlantasPorProvincia([]);
      setPlantasRecentes([]);
      setPlantasPorIdioma([]);
      setReferenciaStats(null);
      setAutorStats(null);
      setReferenciasRecentes([]);
      setAutoresRecentes([]);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Componente de Loading
  const LoadingSpinner: React.FC = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <span className={styles.loadingText}>Carregando dados reais...</span>
    </div>
  );

  // ===== ÍCONES MELHORADOS =====
  
  // Novo ícone para plantas (mais orgânico - folha/planta)
  const LeafIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );

  // Novo ícone para famílias (árvore genealógica/taxonomia)
  const TreeIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8a4 4 0 108 0v10a2 2 0 11-4 0V8zM12 8V6a2 2 0 114 0v2m0 0v10a2 2 0 11-4 0V8m0 0a4 4 0 108 0" />
    </svg>
  );

  // Manter outros ícones iguais
  const LanguageIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
    </svg>
  );

  const SearchIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const DownloadIcon: React.FC = () => (
    <svg className={styles.iconSmall} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );

  const PlusIcon: React.FC = () => (
    <svg className={styles.iconSmall} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5" />
    </svg>
  );

  const MapIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  // ===== NOVO ÍCONE PARA PESQUISAS =====
  const AnalyticsIcon: React.FC = () => (
    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const PlantNameDisplay: React.FC<{ planta: PlantaRecente }> = ({ planta }) => {
    // Se não tem all_names ou tem apenas 1 nome, mostra só o nome principal
    if (!planta.all_names || planta.all_names.length <= 1) {
      return <span className={styles.primaryName}>{planta.name}</span>;
    }

    // Se tem múltiplos nomes, mostra os primeiros 2 + contador
    const displayNames = planta.all_names.slice(0, 2);
    const remainingCount = planta.all_names.length - 2;

    return (
      <div className={styles.plantNameContainer}>
        <span className={styles.primaryName}>
          {displayNames.join(', ')}
          {remainingCount > 0 && (
            <span style={{ color: '#6b7280', fontWeight: 'normal' }}>
              {' '}+{remainingCount} {remainingCount === 1 ? 'nome' : 'nomes'}
            </span>
          )}
        </span>
        <div className={styles.quickTooltip}>
          <span className={styles.infoIcon}>ℹ️</span>
          <div className={styles.quickTooltipContent}>
            <div className={styles.tooltipTitle}>
              Todos os nomes ({planta.all_names.length}):
            </div>
            <div className={styles.namesList}>
              {planta.all_names.map((nome, index) => (
                <div key={index} className={styles.nameItem}>{nome}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Função para contar plantas adicionadas nos últimos X dias
  const contarPlantasRecentes = (plantas: PlantaRecente[], dias: number = 7): number => {
    if (!plantas || plantas.length === 0) return 0;
    
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);
    
    return plantas.filter(planta => {
      if (!planta.added_at) return false;
      const dataAdicao = new Date(planta.added_at);
      return dataAdicao >= dataLimite;
    }).length;
  };

  // Função para criar gráfico de pizza (mantida igual)
  const createPieChart = (data: FamiliaData[]) => {
    if (!data || data.length === 0) return null;
    
    const size = 200;
    const center = size / 2;
    const radius = 80;
    
    let currentAngle = 0;
    const colors = ['#9333ea', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6'];
    
    return (
      <svg width={size} height={size} className={styles.pieChart}>
        {data.map((item, index) => {
          const percentage = item.percentage;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;
          
          const x1 = center + radius * Math.cos(startAngleRad);
          const y1 = center + radius * Math.sin(startAngleRad);
          const x2 = center + radius * Math.cos(endAngleRad);
          const y2 = center + radius * Math.sin(endAngleRad);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <g key={index}>
              <path
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
                className={styles.pieSegment}
              />
              <title>{`${item.name}: ${item.count} plantas (${item.percentage}%)`}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  // Componente de legenda para o gráfico (mantido igual)
  const PieChartLegend: React.FC<{ data: FamiliaData[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    const colors = ['#9333ea', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6'];
    
    return (
      <div className={styles.chartLegend}>
        {data.map((item, index) => (
          <div key={index} className={styles.legendItem}>
            <div 
              className={styles.legendColor}
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span className={styles.legendText}>
              {formatarNomeFamilia(item.name)} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    );
  };
// ADICIONAR APENAS ESTAS:
const abrirModalVisualizacao = async (tipo: 'autor' | 'referencia' | 'planta', item: any) => {
    console.log('👁️ Visualizando:', tipo, item);
    setViewModalType(tipo);
    setLoadingModal(true);
    
    if (tipo === 'planta') {
      try {
        // Construir URL correta para a API principal
        const plantasApiUrl = API_BASE_URL.includes('/dashboard') 
          ? API_BASE_URL.replace('/api/admin/dashboard', '/api/admin/plantas')
          : `${API_BASE_URL.split('/api')[0]}/api/admin/plantas`;
        
        console.log(`🔄 Buscando detalhes completos da planta ${item.id} em: ${plantasApiUrl}/${item.id}`);
        
        const response = await fetch(`${plantasApiUrl}/${item.id}`);
        
        if (response.ok) {
          const plantaCompleta = await response.json();
          console.log('✅ Dados completos da planta carregados:', plantaCompleta);
          console.log('🔍 Verificando campos específicos:', {
            comp_quimica: plantaCompleta.comp_quimica,
            prop_farmacologica: plantaCompleta.prop_farmacologica,
            infos_adicionais: plantaCompleta.infos_adicionais,
            numero_exsicata: plantaCompleta.numero_exsicata
          });
          
          // 🔧 NORMALIZAR estrutura de dados
          const dadosNormalizados: PlantaDetalhadaDashboard = {
            // IDs e nomes básicos
            id_planta: plantaCompleta.id_planta || item.id,
            nome_cientifico: plantaCompleta.nome_cientifico || item.scientific_name || item.nome_cientifico,
            
            // Família (normalizar estrutura)
            familia: typeof plantaCompleta.familia === 'string' 
              ? { nome_familia: plantaCompleta.familia }
              : plantaCompleta.familia || { nome_familia: item.family || 'Não informado' },
            
            // Dados adicionais - GARANTIR QUE SEJAM PRESERVADOS
            numero_exsicata: plantaCompleta.numero_exsicata || item.exsicata || item.numero_exsicata,
            infos_adicionais: plantaCompleta.infos_adicionais || plantaCompleta.informacoes_adicionais,
            comp_quimica: plantaCompleta.comp_quimica || plantaCompleta.composicao_quimica,
            prop_farmacologica: plantaCompleta.prop_farmacologica || plantaCompleta.propriedades_farmacologicas,
            data_adicao: plantaCompleta.data_adicao || item.added_at,
            
            // Arrays garantidos (nunca undefined)
            nomes_comuns: plantaCompleta.nomes_comuns || [],
            provincias: plantaCompleta.provincias || [],
            usos_especificos: plantaCompleta.usos_especificos || plantaCompleta.partes_usadas || [],
            partes_usadas: plantaCompleta.partes_usadas || plantaCompleta.usos_especificos || [],
            autores: plantaCompleta.autores || [],
            referencias_especificas: plantaCompleta.referencias_especificas || plantaCompleta.referencias || [],
            referencias: plantaCompleta.referencias || plantaCompleta.referencias_especificas || [],
            imagens: plantaCompleta.imagens || [],
            
            // Metadados
            metadata: plantaCompleta.metadata
          };
          
          console.log('🔧 Dados normalizados:', dadosNormalizados);
          console.log('📊 Arrays verificados:', {
            nomes_comuns: dadosNormalizados.nomes_comuns.length,
            provincias: dadosNormalizados.provincias.length,
            usos_especificos: dadosNormalizados.usos_especificos.length,
            autores: dadosNormalizados.autores.length,
            referencias: dadosNormalizados.referencias.length,
            imagens: dadosNormalizados.imagens.length
          });
          console.log('📝 Campos de texto:', {
            comp_quimica: dadosNormalizados.comp_quimica ? '✅ Preenchido' : '❌ Vazio',
            prop_farmacologica: dadosNormalizados.prop_farmacologica ? '✅ Preenchido' : '❌ Vazio',
            infos_adicionais: dadosNormalizados.infos_adicionais ? '✅ Preenchido' : '❌ Vazio',
            numero_exsicata: dadosNormalizados.numero_exsicata ? '✅ Preenchido' : '❌ Vazio'
          });
          setSelectedViewItem(dadosNormalizados);
        } else {
          console.error('❌ Erro HTTP:', response.status, response.statusText);
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar detalhes da planta:', error);
        // Fallback com dados básicos
        setSelectedViewItem({
          id_planta: item.id,
          nome_cientifico: item.scientific_name || item.nome_cientifico,
          familia: { nome_familia: item.family || 'Não informado' },
          numero_exsicata: item.exsicata,
          data_adicao: item.added_at,
          nomes_comuns: item.all_names?.map((nome: string, idx: number) => ({
            id_nome: idx,
            nome_comum: nome
          })) || [],
          provincias: [],
          usos_especificos: [],
          partes_usadas: [],
          autores: [],
          referencias_especificas: [],
          referencias: [],
          imagens: []
        });
      }
    } else {
      setSelectedViewItem(item);
    }
    
    setLoadingModal(false);
    setShowViewModal(true);
  };

  const fecharModalVisualizacao = () => {
    setShowViewModal(false);
    setViewModalType(null);
    setSelectedViewItem(null);
  };

  // ✅ FUNÇÃO AUXILIAR PARA VALIDAÇÃO DO FORMULÁRIO
 

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <div className={styles.buttonGroup}>
            <Link href="/admin/plants/add" className={styles.buttonGreen}>
              <PlusIcon />
              <span>Adicionar Planta</span>
            </Link>
            {error && (
              <button className={styles.buttonBlue} onClick={fetchData}>
                <span>🔄 Tentar Novamente</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorContainer}>
            <div className={styles.errorMessage}>
              ⚠️ {error}
              <br />
              <small>Verifique se a API está rodando em {API_BASE_URL}</small>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {loading ? (
          <LoadingSpinner />
        ) : stats ? (
          <div className={styles.statsGrid}>
            {/* ===== ÍCONE MELHORADO PARA PLANTAS ===== */}
            {/* Card 1 - Total de Plantas */}
            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.iconContainerGreen}>
                  <LeafIcon />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Total de Plantas</p>
                  <p className={styles.statValue}>{getStatValue(stats?.total_plantas)}</p>
                </div>
              </div>
              <div className={styles.statFooter}>
                <div className={styles.statChange}>
                  {(() => {
                    const recentesCount = contarPlantasRecentes(plantasRecentes, 7);
                    if (recentesCount > 0) {
                      return (
                        <span className={styles.statIncrease}>
                          {recentesCount} {recentesCount === 1 ? 'adicionada' : 'adicionadas'} nos últimos 7 dias
                        </span>
                      );
                    } else if (plantasRecentes.length > 0) {
                      return (
                        <span className={styles.statPeriod}>
                          Última adição há mais de 7 dias
                        </span>
                      );
                    }
                    return (
                      <span className={styles.statPeriod}>
                        Base de dados actualizada
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
            {/* Card 2 - Famílias Botânicas */}
            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.iconContainerPurple}>
                  <TreeIcon />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Famílias Botânicas</p>
                  <p className={styles.statValue}>{getStatValue(stats?.total_familias)}</p>
                </div>
              </div>
              <div className={styles.statFooter}>
                <div className={styles.statChange}>
                  <span className={styles.statIncrease}>
                    {plantasPorFamilia.length > 0 && plantasPorFamilia[0] 
                      ? `${formatarNomeFamilia(plantasPorFamilia[0].name)} é a maior família`
                      : 'Diversidade taxonómica'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3 - Idiomas Disponíveis */}
            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.iconContainerBlue}>
                  <LanguageIcon />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Idiomas Disponíveis</p>
                  <p className={styles.statValue}>{getStatValue(stats?.idiomas_disponiveis)}</p>
                </div>
              </div>
              <div className={styles.statFooter}>
                <div className={styles.statChange}>
                  <span className={styles.statIncrease}>
                    {plantasPorIdioma.length > 0 && plantasPorIdioma[0]
                      ? `${plantasPorIdioma[0].language} com ${plantasPorIdioma[0].count} plantas`
                      : 'Sistema multilíngue'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.loadingContainer}>
            <span className={styles.loadingText}>Dados não disponíveis</span>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsHeader}>
            <nav className={styles.tabsNav}>
              {[
                { id: 'overview', label: 'Visão Geral' },
                { id: 'categories', label: 'Famílias' },
                { id: 'languages', label: 'Idiomas' },
                { id: 'locations', label: 'Locais de Colheita' },
                { id: 'references', label: 'Referências' },
                { id: 'authors', label: 'Autores' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className={styles.tabContent}>
            {/* Visão Geral (mantida igual) */}
            {activeTab === 'overview' && (
              <div>
                <h3 className={styles.tabTitle}>Visão Geral do Sistema</h3>
                <p className={styles.tabDescription}>
                  Bem-vindo ao painel administrativo do PhytoMoz. Aqui você pode gerir todas as plantas, famílias botânicas,
                  idiomas e locais de colheita, referências e autores no sistema.
                </p>

                {/* Plantas Recentes */}
                {loading ? (
                  <LoadingSpinner />
                ) : plantasRecentes.length > 0 ? (
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Plantas Recentemente Adicionadas</h4>
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead className={styles.tableHead}>
                          <tr>
                            <th className={styles.tableHeader}>Nome</th>
                            <th className={styles.tableHeader}>Nome Científico</th>
                            <th className={styles.tableHeader}>Família</th>
                            <th className={styles.tableHeader}>
                              <span className={styles.srOnly}>Ver</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                          {plantasRecentes.map((planta, index) => (
                            <tr key={`planta-${planta.id}-${index}`} className={styles.tableRow}>
                              <td className={styles.tableCell}>
                                <PlantNameDisplay planta={planta} />
                              </td>
                              <td className={styles.tableCell}>
                                <em>{planta.scientific_name}</em>
                              </td>
                              <td className={styles.tableCell}>{planta.family}</td>
                              <td className={styles.tableCellAction}>
                                <button 
                                  onClick={() => abrirModalVisualizacao('planta', {
                                    id: planta.id,
                                    name: planta.name,
                                    all_names: planta.all_names || [],
                                    names_count: planta.names_count || 0,
                                    scientific_name: planta.scientific_name,
                                    nome_cientifico: planta.scientific_name,
                                    family: planta.family,
                                    exsicata: planta.exsicata,
                                    numero_exsicata: planta.exsicata,
                                    added_at: planta.added_at
                                  })}
                                  className={styles.viewButton}
                                >
                                  Ver
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhuma planta recente disponível</span>
                  </div>
                )}

                {/* Quick Actions */}
                {/* <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>Acções Rápidas</h4>
                  <div className={styles.quickActionsGrid}>
                    <div className={styles.quickActionCardPurple}>
                      <div className={styles.quickActionContent}>
                        <div className={styles.quickActionIconPurple}>
                          <LeafIcon />
                        </div>
                        <div className={styles.quickActionInfo}>
                          <p className={styles.quickActionTitle}>Adicionar Nova Planta</p>
                          <p className={styles.quickActionDescription}>Cadastre uma nova planta na base de dados</p>
                        </div>
                      </div>
                      <div className={styles.quickActionFooter}>
                        <a href="#" className={styles.quickActionLinkPurple}>
                          Iniciar →
                        </a>
                      </div>
                    </div>

                    <div className={styles.quickActionCardGreen}>
                      <div className={styles.quickActionContent}>
                        <div className={styles.quickActionIconGreen}>
                          <LanguageIcon />
                        </div>
                        <div className={styles.quickActionInfo}>
                          <p className={styles.quickActionTitle}>Gestão de Traduções</p>
                          <p className={styles.quickActionDescription}>Adicione ou edite traduções para os idiomas disponíveis</p>
                        </div>
                      </div>
                      <div className={styles.quickActionFooter}>
                        <a href="#" className={styles.quickActionLinkGreen}>
                          Iniciar →
                        </a>
                      </div>
                    </div>

                    <div className={styles.quickActionCardBlue}>
                      <div className={styles.quickActionContent}>
                        <div className={styles.quickActionIconBlue}>
                          <MapIcon />
                        </div>
                        <div className={styles.quickActionInfo}>
                          <p className={styles.quickActionTitle}>Mapear Locais</p>
                          <p className={styles.quickActionDescription}>Adicione ou edite locais de colheita</p>
                        </div>
                      </div>
                      <div className={styles.quickActionFooter}>
                        <a href="#" className={styles.quickActionLinkBlue}>
                          Iniciar →
                        </a>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            )}

            {/* ===== ABA FAMÍLIAS COM TABELA ATUALIZADA (SEM EMOJIS E COLUNA DIVERSIDADE) ===== */}
            {activeTab === 'categories' && (
              <div>
                <h3 className={styles.tabTitle}>Plantas por Família</h3>
                <p className={styles.tabDescription}>
                  Visualize a distribuição de plantas por família botânica na base de dados.
                </p>

                {loading ? (
                  <LoadingSpinner />
                ) : plantasPorFamilia.length > 0 ? (
                  <>
                    <div className={styles.chartsGrid}>
                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Distribuição por Família</h4>
                        <div className={styles.pieChartContainer}>
                          <div className={styles.pieChartWrapper}>
                            {createPieChart(plantasPorFamilia)}
                          </div>
                          <PieChartLegend data={plantasPorFamilia} />
                        </div>
                      </div>

                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Diversidade</h4>
                        <div className={styles.progressList}>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Família com maior número de plantas</span>
                              <span className={styles.progressValue}>
                                {plantasPorFamilia[0]?.name ? formatarNomeFamilia(plantasPorFamilia[0].name) : 'N/A'}
                              </span>
                            </div>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFillGreen} 
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <span className={styles.progressPercentage}>
                              {plantasPorFamilia[0]?.count || 0} plantas ({plantasPorFamilia[0]?.percentage || 0}%)
                            </span>
                          </div>

                          {/* <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Top 3 Concentração</span>
                              <span className={styles.progressValue}>
                                {plantasPorFamilia.slice(0, 3).reduce((sum, f) => sum + f.percentage, 0).toFixed(1)}%
                              </span>
                            </div>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFillBlue} 
                                style={{ 
                                  width: `${plantasPorFamilia.slice(0, 3).reduce((sum, f) => sum + f.percentage, 0)}%` 
                                }}
                              ></div>
                            </div>
                            <span className={styles.progressPercentage}>Das plantas totais</span>
                          </div> */}

                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Total de Famílias</span>
                              <span className={styles.progressValue}>{plantasPorFamilia.length} famílias</span>
                            </div>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFillPurple} 
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <span className={styles.progressPercentage}>Com plantas cadastradas</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* ===== NOVA TABELA DE FAMÍLIAS (SEM EMOJIS E SEM COLUNA DIVERSIDADE) ===== */}
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>Famílias Cadastradas</h4>
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead className={styles.tableHead}>
                            <tr>
                              <th className={styles.tableHeader}>Posição</th>
                              <th className={styles.tableHeader}>Nome da Família</th>
                              <th className={styles.tableHeader}>Total de Plantas</th>
                              <th className={styles.tableHeader}>Percentual</th>
                              <th className={styles.tableHeader}>
                                <span className={styles.srOnly}>Gerir</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className={styles.tableBody}>
                            {plantasPorFamilia.map((familia, index) => (
                              <tr key={index} className={styles.tableRow}>
                                <td className={styles.tableCell}>
                                  <span style={{ fontWeight: '600', color: '#9333ea' }}>#{index + 1}</span>
                                </td>
                                <td className={styles.tableCell}>
                                  <div className={styles.tableCellTitle}>
                                    {formatarNomeFamilia(familia.name)}
                                  </div>
                                </td>
                                <td className={styles.tableCell}>
                                  <span style={{ fontWeight: '600', color: '#111827' }}>
                                    {familia.count}
                                  </span>
                                  <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '0.25rem' }}>
                                    plantas
                                  </span>
                                </td>
                                <td className={styles.tableCell}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: '500', color: '#9333ea' }}>
                                      {familia.percentage}%
                                    </span>
                                    <div style={{ 
                                      width: '40px', 
                                      height: '4px', 
                                      backgroundColor: '#e5e7eb', 
                                      borderRadius: '2px',
                                      overflow: 'hidden'
                                    }}>
                                      <div 
                                        style={{ 
                                          width: `${familia.percentage}%`, 
                                          height: '100%', 
                                          backgroundColor: '#9333ea',
                                          transition: 'width 0.3s ease'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className={styles.tableCellAction}>
                                  {/* ✅ USAR A FUNÇÃO isManageableFamily AQUI */}
                                  {isManageableFamily(familia.name) ? (
                                    <Link 
                                      href={`/admin/plants?familia=${encodeURIComponent(familia.name)}&highlight_familia=true&from=dashboard`}
                                      className={styles.editLink}
                                      title={`Ver todas as plantas da família ${formatarNomeFamilia(familia.name)}`}
                                    >
                                      Gerir
                                    </Link>
                                  ) : (
                                    <span 
                                      style={{ 
                                        color: '#d1d5db', 
                                        fontSize: '0.875rem',
                                        textAlign: 'center',
                                        display: 'block'
                                      }}
                                      title="Agrupamento de famílias menores - não gerível individualmente"
                                    >
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhum dado de família disponível</span>
                  </div>
                )}

                <div className={styles.viewAllContainer}>
                  <a href="/admin/familias" className={styles.buttonPurple}>
                    Gerir famílias
                  </a>
                </div>
              </div>
            )}

            {/* Idiomas */}
            {activeTab === 'languages' && (
              <div>
                <h3 className={styles.tabTitle}>Plantas por Idioma</h3>
                <p className={styles.tabDescription}>
                  Visualize a distribuição de plantas por idioma disponível na base de dados.
                </p>

                {loading ? (
                  <LoadingSpinner />
                ) : plantasPorIdioma.length > 0 ? (
                  <div className={styles.chartCard}>
                    <h4 className={styles.chartTitle}>Cobertura por Idioma</h4>
                    <div className={styles.progressList}>
                      {plantasPorIdioma.map((idioma, index) => (
                        <div key={index} className={styles.progressItem}>
                          <div className={styles.progressInfo}>
                            <span className={styles.progressLabel}>{idioma.language}</span>
                            <span className={styles.progressValue}>{idioma.count} plantas</span>
                          </div>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFillGreen} 
                              style={{ width: `${idioma.percentage}%` }}
                            ></div>
                          </div>
                          <span className={styles.progressPercentage}>{idioma.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhum dado de idioma disponível</span>
                  </div>
                )}

                <div className={styles.viewAllContainer}>
                  <a href="/admin/languages" className={styles.buttonGreen}>
                    Gerir idiomas
                  </a>
                </div>
              </div>
            )}

            {/* Locais de Colheita */}
            {activeTab === 'locations' && (
              <div>
                <h3 className={styles.tabTitle}>Plantas por Local de Colheita</h3>
                <p className={styles.tabDescription}>
                  Visualize a distribuição de plantas por local de colheita em Moçambique.
                </p>

                {loading ? (
                  <LoadingSpinner />
                ) : plantasPorProvincia.length > 0 ? (
                  <div className={styles.chartCard}>
                    <h4 className={styles.chartTitle}>Distribuição por Província</h4>
                    <div className={styles.progressListScroll}>
                      {plantasPorProvincia.map((provincia, index) => (
                        <div key={index} className={styles.progressItem}>
                          <div className={styles.progressInfo}>
                            <span className={styles.progressLabel}>{provincia.name}</span>
                            <span className={styles.progressValue}>{provincia.count} plantas</span>
                          </div>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFillBlue} 
                              style={{ width: `${provincia.percentage}%` }}
                            ></div>
                          </div>
                          <span className={styles.progressPercentage}>{provincia.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhum dado de província disponível</span>
                  </div>
                )}

                {/* <div className={styles.viewAllContainer}>
                  <a href="/admin/locations" className={styles.buttonBlue}>
                    Gerir locais
                  </a>
                </div> */}
              </div>
            )}

{/* Referências */}
{activeTab === 'references' && (
  <div>
    <h3 className={styles.tabTitle}>Gestão de Referências</h3>
    <p className={styles.tabDescription}>
      Visualize e faça a gestão das referências bibliográficas do sistema.
    </p>

    {loading ? (
      <LoadingSpinner />
    ) : referenciaStats ? (
      <>
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h4 className={styles.chartTitle}>Distribuição por Tipo</h4>
            <div className={styles.progressList}>
              {referenciaStats.tipos && Array.isArray(referenciaStats.tipos) && referenciaStats.tipos.length > 0 ? (
                referenciaStats.tipos.map((tipo, index) => (
                  <div key={index} className={styles.progressItem}>
                    <div className={styles.progressInfo}>
                      <span className={styles.progressLabel}>{tipo.tipo}</span>
                      <span className={styles.progressValue}>{tipo.count} referências</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFillPurple} 
                        style={{ width: `${(tipo.count / referenciaStats.total_referencias) * 100}%` }}
                      ></div>
                    </div>
                    <span className={styles.progressPercentage}>
                      {((tipo.count / referenciaStats.total_referencias) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.noData}>Nenhum tipo de referência disponível</div>
              )}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h4 className={styles.chartTitle}>Estatísticas Gerais</h4>
            <div className={styles.progressList}>
              <div className={styles.progressItem}>
                <div className={styles.progressInfo}>
                  <span className={styles.progressLabel}>Total de Referências</span>
                  <span className={styles.progressValue}>{referenciaStats.total_referencias}</span>
                </div>
              </div>
              <div className={styles.progressItem}>
                <div className={styles.progressInfo}>
                  <span className={styles.progressLabel}>Com Plantas Associadas</span>
                  <span className={styles.progressValue}>{referenciaStats.referencias_com_plantas}</span>
                </div>
              </div>
              <div className={styles.progressItem}>
                <div className={styles.progressInfo}>
                  <span className={styles.progressLabel}>Sem Ano Definido</span>
                  <span className={styles.progressValue}>{referenciaStats.referencias_sem_ano}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referências Recentes */}
        {referenciasRecentes && Array.isArray(referenciasRecentes) && referenciasRecentes.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Referências Recentemente Adicionadas</h4>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeader}>Título</th>
                    <th className={styles.tableHeader}>Tipo</th>
                    <th className={styles.tableHeader}>Ano</th>
                    <th className={styles.tableHeader}>Plantas</th>
                    <th className={styles.tableHeader}>Autores</th>
                    <th className={styles.tableHeader}>
                      <span className={styles.srOnly}>Ver</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {referenciasRecentes.map((ref) => (
                    <tr key={ref.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <div className={styles.tableCellTitle}>
                            {ref.titulo && ref.titulo.length > 50 
                              ? `${ref.titulo.substring(0, 50)}...` 
                              : (ref.titulo || 'Sem título')}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.badge}>{ref.tipo}</span>
                      </td>
                      <td className={styles.tableCell}>{ref.ano || 'N/A'}</td>
                      <td className={styles.tableCell}>{ref.total_plantas}</td>
                      <td className={styles.tableCell}>
                        <div className={styles.authorList}>
                          {ref.autores && ref.autores.length > 0 ? ref.autores.slice(0, 2).join(', ') : 'Sem autores'}
                          {ref.autores && ref.autores.length > 2 && ` +${ref.autores.length - 2}`}
                        </div>
                      </td>
                      <td className={styles.tableCellAction}>
                        <button 
                          onClick={() => abrirModalVisualizacao('referencia', {
                            id_referencia: ref.id,
                            titulo_referencia: ref.titulo,
                            tipo_referencia: ref.tipo,
                            ano: ref.ano,
                            link_referencia: ref.link,
                            total_plantas: ref.total_plantas,
                            autores: ref.autores
                          })}
                          className={styles.viewButton}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Referências Mais Utilizadas */}
        {referenciaStats.mais_utilizadas && Array.isArray(referenciaStats.mais_utilizadas) && referenciaStats.mais_utilizadas.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Referências Mais Utilizadas</h4>
            <div className={styles.progressList}>
              {referenciaStats.mais_utilizadas.slice(0, 5).map((ref, index) => (
                <div key={index} className={styles.progressItem}>
                  <div className={styles.progressInfo}>
                    <span className={styles.progressLabel}>
                      {ref.titulo.length > 40 ? `${ref.titulo.substring(0, 40)}...` : ref.titulo}
                      {ref.ano && ` (${ref.ano})`}
                    </span>
                    <span className={styles.progressValue}>{ref.total_plantas} plantas</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFillPurple} 
                      style={{ 
                        width: `${(ref.total_plantas / Math.max(...referenciaStats.mais_utilizadas.map(r => r.total_plantas))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    ) : (
      <div className={styles.loadingContainer}>
        <span className={styles.loadingText}>Nenhum dado de referência disponível</span>
      </div>
    )}

    <div className={styles.viewAllContainer}>
      <Link href="/admin/references?tab=referencias" className={styles.buttonPurple}>
        Gerir referências
      </Link>
    </div>
  </div>
)}

            {/* Autores */}
            {/* Autores */}
            {activeTab === 'authors' && (
              <div>
                <h3 className={styles.tabTitle}>Gestão de Autores</h3>
                <p className={styles.tabDescription}>
                  Visualize e faça a gestão dos autores.
                </p>

                {loading ? (
                  <LoadingSpinner />
                ) : autorStats ? (
                  <>
                    <div className={styles.chartsGrid}>
                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Autores Mais Produtivos</h4>
                        <div className={styles.progressList}>
                          {autorStats.mais_produtivos && Array.isArray(autorStats.mais_produtivos) && autorStats.mais_produtivos.length > 0 ? (
                            autorStats.mais_produtivos.slice(0, 5).map((autor, index) => (
                              <div key={index} className={styles.progressItem}>
                                <div className={styles.progressInfo}>
                                  <span className={styles.progressLabel}>
                                    {autor.nome}
                                    {autor.sigla && ` (${autor.sigla})`}
                                  </span>
                                  <span className={styles.progressValue}>{autor.total_plantas} plantas</span>
                                </div>
                                <div className={styles.progressBar}>
                                  <div 
                                    className={styles.progressFillGreen} 
                                    style={{ 
                                      width: `${(autor.total_plantas / Math.max(...autorStats.mais_produtivos.map(a => a.total_plantas))) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className={styles.noData}>Nenhum autor produtivo disponível</div>
                          )}
                        </div>
                      </div>

                      <div className={styles.chartCard}>
                        <h4 className={styles.chartTitle}>Estatísticas Gerais</h4>
                        <div className={styles.progressList}>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Total de Autores</span>
                              <span className={styles.progressValue}>{autorStats.total_autores}</span>
                            </div>
                          </div>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Com Plantas Associadas</span>
                              <span className={styles.progressValue}>{autorStats.autores_com_plantas}</span>
                            </div>
                          </div>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Sem Afiliação</span>
                              <span className={styles.progressValue}>{autorStats.autores_sem_afiliacao}</span>
                            </div>
                          </div>
                          <div className={styles.progressItem}>
                            <div className={styles.progressInfo}>
                              <span className={styles.progressLabel}>Total de Afiliações</span>
                              <span className={styles.progressValue}>{autorStats.total_afiliacoes}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Autores Recentes */}
                    {autoresRecentes && Array.isArray(autoresRecentes) && autoresRecentes.length > 0 && (
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Autores Recentemente Adicionados</h4>
                        <div className={styles.tableContainer}>
                          <table className={styles.table}>
                            <thead className={styles.tableHead}>
                              <tr>
                                <th className={styles.tableHeader}>Nome</th>
                                <th className={styles.tableHeader}>Afiliação</th>
                                <th className={styles.tableHeader}>Sigla</th>
                                <th className={styles.tableHeader}>Plantas</th>
                                <th className={styles.tableHeader}>Referências</th>
                                <th className={styles.tableHeader}>
                                  <span className={styles.srOnly}>Ver</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                              {autoresRecentes.map((autor) => (
                                <tr key={autor.id} className={styles.tableRow}>
                                  <td className={styles.tableCell}>
                                    <div className={styles.tableCellTitle}>{autor.nome}</div>
                                  </td>
                                  <td className={styles.tableCell}>
                                    <div className={styles.affiliationText}>
                                      {autor.afiliacao && autor.afiliacao.length > 30 
                                        ? `${autor.afiliacao.substring(0, 30)}...` 
                                        : (autor.afiliacao || 'Sem afiliação')}                                    </div>
                                  </td>
                                  <td className={styles.tableCell}>
                                    {autor.sigla && <span className={styles.badge}>{autor.sigla}</span>}
                                  </td>
                                  <td className={styles.tableCell}>{autor.total_plantas}</td>
                                  <td className={styles.tableCell}>{autor.total_referencias}</td>
                                  <td className={styles.tableCellAction}>
                                    <button 
                                      onClick={() => abrirModalVisualizacao('autor', {
                                        id_autor: autor.id,
                                        nome_autor: autor.nome,
                                        afiliacao: autor.afiliacao,
                                        sigla_afiliacao: autor.sigla,
                                        total_plantas: autor.total_plantas,
                                        total_referencias: autor.total_referencias
                                      })}
                                      className={styles.viewButton}
                                    >
                                      Ver
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Distribuição por Afiliação */}
                    {autorStats.por_afiliacao && Array.isArray(autorStats.por_afiliacao) && autorStats.por_afiliacao.length > 0 && (
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Distribuição por Afiliação</h4>
                        <div className={styles.progressListScroll}>
                          {autorStats.por_afiliacao.slice(0, 8).map((afiliacao, index) => (
                            <div key={index} className={styles.progressItem}>
                              <div className={styles.progressInfo}>
                                <span className={styles.progressLabel}>
                                  {afiliacao.afiliacao.length > 35 ? `${afiliacao.afiliacao.substring(0, 35)}...` : afiliacao.afiliacao}
                                </span>
                                <span className={styles.progressValue}>
                                  {afiliacao.total_autores} autores, {afiliacao.total_plantas} plantas
                                </span>
                              </div>
                              <div className={styles.progressBar}>
                                <div 
                                  className={styles.progressFillBlue} 
                                  style={{ 
                                    width: `${(afiliacao.total_plantas / Math.max(...autorStats.por_afiliacao.map(a => a.total_plantas))) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.loadingContainer}>
                    <span className={styles.loadingText}>Nenhum dado de autor disponível</span>
                  </div>
                )}

                <div className={styles.viewAllContainer}>
                  <Link href="/admin/references?tab=autores" className={styles.buttonGreen}>
                    Gerir autores
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showViewModal && (
        <div className={styles.modalOverlay} onClick={fecharModalVisualizacao}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {viewModalType === 'autor' ? 'Detalhes do Autor' : 
                viewModalType === 'referencia' ? 'Detalhes da Referência' : 
                'Detalhes da Planta'}
              </h2>
              <button 
                className={styles.modalCloseButton}
                onClick={fecharModalVisualizacao}
                aria-label="Fechar modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
            {viewModalType === 'autor' ? (
              <div className={styles.viewDetailsGrid}>
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>Nome do Autor</div>
                  <div className={styles.viewDetailValue}>
                    {selectedViewItem?.nome_autor || selectedViewItem?.nome || 'Não informado'}
                  </div>
                </div>
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>Afiliação</div>
                  <div className={styles.viewDetailValue}>
                    {selectedViewItem?.afiliacao || 'Não informado'}
                  </div>
                </div>
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>Sigla da Afiliação</div>
                  <div className={styles.viewDetailValue}>
                    {selectedViewItem?.sigla_afiliacao || selectedViewItem?.sigla || 'Não informado'}
                  </div>
                </div>
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>Total de Plantas</div>
                  <div className={styles.viewDetailValue}>
                    <span className={styles.statBadge}>
                      {selectedViewItem?.total_plantas || 0} plantas
                    </span>
                  </div>
                </div>
              </div>
            ) : viewModalType === 'referencia' ? (
              <div className={styles.viewDetailsGrid}>
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>Título da Referência</div>
                  <div className={styles.viewDetailValue}>
                    {selectedViewItem?.titulo_referencia || selectedViewItem?.titulo || 'Não informado'}
                  </div>
                </div>
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>Tipo de Referência</div>
                  <div className={styles.viewDetailValue}>
                    <span className={styles.badge}>
                      {selectedViewItem?.tipo_referencia || selectedViewItem?.tipo || 'Não informado'}
                    </span>
                  </div>
                </div>
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>Ano de Publicação</div>
                  <div className={styles.viewDetailValue}>
                    {selectedViewItem?.ano || 'Não informado'}
                  </div>
                </div>
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>Link/URL</div>
                  <div className={styles.viewDetailValue}>
                    {selectedViewItem?.link_referencia || selectedViewItem?.link ? (
                      <a 
                        href={selectedViewItem?.link_referencia || selectedViewItem?.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkButton}
                      >
                        🔗 Abrir Link
                      </a>
                    ) : (
                      'Não informado'
                    )}
                  </div>
                </div>
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>Total de Plantas</div>
                  <div className={styles.viewDetailValue}>
                    <span className={styles.statBadge}>
                      {selectedViewItem?.total_plantas || 0} plantas
                    </span>
                  </div>
                </div>
                {selectedViewItem?.autores && Array.isArray(selectedViewItem.autores) && selectedViewItem.autores.length > 0 && (
                  <div className={styles.viewDetailItem} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.viewDetailLabel}>Autores</div>
                    <div className={styles.viewDetailValue}>
                      <div className={styles.authorsList}>
                        {selectedViewItem.autores.map((autor: string, index: number) => (
                          <span key={index} className={styles.authorTag}>
                            {autor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className={styles.viewDetailItem}>
                  <div className={styles.viewDetailLabel}>ID da Referência</div>
                  <div className={styles.viewDetailValue}>
                    <code className={styles.codeText}>
                      #{selectedViewItem?.id_referencia || selectedViewItem?.id || 'N/A'}
                    </code>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Informações Básicas */}
                <div className={styles.modalSection}>
                  <h3 className={styles.sectionTitle}>Informações Básicas</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>Nome Científico</label>
                      <span><em>{selectedViewItem?.nome_cientifico || 'Não informado'}</em></span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Família Botânica</label>
                      <span>{safeUpper(selectedViewItem?.familia?.nome_familia) || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Nomes Comuns - CORRIGIDO */}
                {selectedViewItem?.nomes_comuns && Array.isArray(selectedViewItem.nomes_comuns) && selectedViewItem.nomes_comuns.length > 0 ? (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>
                      Nomes Comuns ({selectedViewItem.nomes_comuns.length})
                    </h3>
                    <div className={styles.badgesContainer}>
                      {selectedViewItem.nomes_comuns.map((nome: any, index: number) => (
                        <span key={nome?.id_nome || index} className={styles.badgeSimple}>
                          {nome?.nome_comum || nome || 'Sem nome'}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : selectedViewItem?.all_names && Array.isArray(selectedViewItem.all_names) && selectedViewItem.all_names.length > 0 ? (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>
                      Nomes Comuns ({selectedViewItem.all_names.length})
                    </h3>
                    <div className={styles.badgesContainer}>
                      {selectedViewItem.all_names.map((nome: string, index: number) => (
                        <span key={index} className={styles.badgeSimple}>
                          {nome}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Nomes Comuns</h3>
                    <div className={styles.noData}>Nenhum nome comum registado</div>
                  </div>
                )}

                {/* Províncias - CORRIGIDO */}
                {selectedViewItem?.provincias && Array.isArray(selectedViewItem.provincias) && selectedViewItem.provincias.length > 0 ? (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Províncias de Ocorrência ({selectedViewItem.provincias.length})</h3>
                    <div className={styles.badgesContainer}>
                      {selectedViewItem.provincias.map((provincia: any, index: number) => (
                        <span key={index} className={styles.badgeSimple}>
                          {provincia?.nome_provincia || 'Sem nome'}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Províncias de Ocorrência</h3>
                    <div className={styles.noData}>Nenhuma província registada</div>
                  </div>
                )}

                {/* Usos Medicinais - CORRIGIDO */}
                {selectedViewItem?.usos_especificos && Array.isArray(selectedViewItem.usos_especificos) && selectedViewItem.usos_especificos.length > 0 ? (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Usos Medicinais ({selectedViewItem.usos_especificos.length})</h3>
                    <div className={styles.usosEspecificosList}>
                      {selectedViewItem.usos_especificos.map((uso: any, index: number) => (
                        <div key={index} className={styles.usoEspecificoCard}>
                          <div className={styles.parteUsadaHeader}>
                            🌿 Parte usada: {uso?.parte_usada || 'Não especificada'}
                          </div>
                          
                          {uso?.observacoes && (
                            <div className={styles.observacoes}>
                              "{uso.observacoes}"
                            </div>
                          )}

                          {uso?.indicacoes && Array.isArray(uso.indicacoes) && uso.indicacoes.length > 0 && (
                            <div className={styles.usoDetailSection}>
                              <div className={styles.usoDetailTitle}>Indicações:</div>
                              <div className={styles.badgesContainer}>
                                {uso.indicacoes.map((ind: any, i: number) => (
                                  <span key={i} className={styles.badgeSimple} style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                                    {ind?.descricao || 'Sem descrição'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {uso?.metodos_preparacao && Array.isArray(uso.metodos_preparacao) && uso.metodos_preparacao.length > 0 && (
                            <div className={styles.usoDetailSection}>
                              <div className={styles.usoDetailTitle}>Métodos de Preparação:</div>
                              <div className={styles.badgesContainer}>
                                {uso.metodos_preparacao.map((met: any, i: number) => (
                                  <span key={i} className={styles.badgeSimple} style={{ borderColor: '#10b981', color: '#10b981' }}>
                                    {met?.descricao || 'Sem descrição'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {uso?.metodos_extracao && Array.isArray(uso.metodos_extracao) && uso.metodos_extracao.length > 0 && (
                            <div className={styles.usoDetailSection}>
                              <div className={styles.usoDetailTitle}>Métodos de Extracção:</div>
                              <div className={styles.badgesContainer}>
                                {uso.metodos_extracao.map((ext: any, i: number) => (
                                  <span key={i} className={styles.badgeSimple} style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
                                    {ext?.descricao || 'Sem descrição'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Usos Medicinais</h3>
                    <div className={styles.noData}>Nenhum uso medicinal registado</div>
                  </div>
                )}

{/* Informações Adicionais */}
                {selectedViewItem?.infos_adicionais ? (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Informações Adicionais</h3>
                    <div className={styles.infoItem}>
                      <p style={{ 
                        padding: '1rem', 
                        backgroundColor: '#f9fafb', 
                        borderLeft: '4px solid #3b82f6',
                        borderRadius: '4px',
                        lineHeight: '1.6',
                        color: '#374151'
                      }}>
                        {selectedViewItem.infos_adicionais}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Composição Química - SEPARADO POR VÍRGULAS/PONTO-E-VÍRGULA */}
                {selectedViewItem?.comp_quimica ? (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>
                      Composição Química ({selectedViewItem.comp_quimica.split(/[,;]/).filter((item: string) => item.trim()).length})
                    </h3>
                    <div className={styles.badgesContainer}>
                      {selectedViewItem.comp_quimica.split(/[,;]/).filter((item: string) => item.trim()).map((composto: string, index: number) => (
                        <span key={index} className={styles.badgeSimple} style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
                          {composto.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Composição Química</h3>
                    <div className={styles.noData}>Composição química não informada</div>
                  </div>
                )}

                {/* Propriedades Farmacológicas - SEPARADO POR VÍRGULAS/PONTO-E-VÍRGULA */}
                {selectedViewItem?.prop_farmacologica ? (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>
                      Propriedades Farmacológicas ({selectedViewItem.prop_farmacologica.split(/[,;]/).filter((item: string) => item.trim()).length})
                    </h3>
                    <div className={styles.badgesContainer}>
                      {selectedViewItem.prop_farmacologica.split(/[,;]/).filter((item: string) => item.trim()).map((prop: string, index: number) => (
                        <span key={index} className={styles.badgeSimple} style={{ borderColor: '#059669', color: '#059669' }}>
                          {prop.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Propriedades Farmacológicas</h3>
                    <div className={styles.noData}>Propriedades farmacológicas não informadas</div>
                  </div>
                )}

                {/* Autores - CORRIGIDO */}
                {selectedViewItem?.autores && Array.isArray(selectedViewItem.autores) && selectedViewItem.autores.length > 0 ? (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Autores ({selectedViewItem.autores.length})</h3>
                    <div className={styles.badgesContainer}>
                      {selectedViewItem.autores.map((autor: any, index: number) => (
                        <span key={index} className={styles.badgeSimple}>
                          {autor?.nome_autor || 'Sem nome'}
                          {autor?.sigla_afiliacao && ` (${autor.sigla_afiliacao})`}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Autores</h3>
                    <div className={styles.noData}>Nenhum autor registado</div>
                  </div>
                )}

                {/* Referências - CORRIGIDO */}
                {selectedViewItem?.referencias_especificas && Array.isArray(selectedViewItem.referencias_especificas) && selectedViewItem.referencias_especificas.length > 0 ? (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Referências ({selectedViewItem.referencias_especificas.length})</h3>
                    <div className={styles.referenciasEspecificasList}>
                      {selectedViewItem.referencias_especificas.map((ref: any, index: number) => (
                        <div key={index} className={styles.referenciaEspecificaCard}>
                          <div className={styles.referenciaHeader}>
                            <div className={styles.refTitulo}>{ref?.titulo || 'Sem título'}</div>
                            <div className={styles.refDetails}>
                              {ref?.tipo || 'Sem tipo'} • {ref?.ano || 'Sem ano'}
                              {ref?.link && (
                                <span className={styles.refLink}>
                                  <a href={ref.link} target="_blank" rel="noopener noreferrer">
                                    🔗 Abrir Link
                                  </a>
                                </span>
                              )}
                            </div>
                          </div>
                          {ref?.autores_especificos && Array.isArray(ref.autores_especificos) && ref.autores_especificos.length > 0 && (
                            <div>
                              <div className={styles.usoDetailTitle}>Autores da Referência:</div>
                              <div className={styles.badgesContainer}>
                                {ref.autores_especificos.map((autor: any, i: number) => (
                                  <span key={i} className={styles.badgeSimple} style={{ fontSize: '0.75rem' }}>
                                    {autor?.nome_autor || 'Sem nome'}
                                    {autor?.ordem_autor && ` (${autor.ordem_autor}º)`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.modalSection}>
                    <h3 className={styles.sectionTitle}>Referências</h3>
                    <div className={styles.noData}>Nenhuma referência registada</div>
                  </div>
                )}

                {/* ID da Planta */}
                <div className={styles.modalSection}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>ID da Planta</label>
                      <span>
                        <code style={{ 
                          fontFamily: 'monospace', 
                          backgroundColor: '#f3f4f6', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          #{selectedViewItem?.id_planta || selectedViewItem?.id || 'N/A'}
                        </code>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary}
                onClick={fecharModalVisualizacao}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardComponent;