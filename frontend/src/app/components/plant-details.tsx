"use client"
import type { Plant } from "@/context/search-context"
import { useLanguage } from "@/context/language-context"
import { useState } from "react"
import styles from "./plant-details.module.css"
import PlantImageGallery, { PlantImage } from "./plant-image-gallery"

interface PlantDetailsProps {
  plant: Plant
}

// Componente melhorado para mostrar correlação Parte Usada ↔ Usos
function ParteUsadaCorrelacao({ plant }: { plant: Plant }) {
  const [expandedPartes, setExpandedPartes] = useState<Set<string>>(new Set())
  
  const usosEspecificos = plant.usos_especificos || []
  
  const toggleParte = (key: string) => {
    const newExpanded = new Set(expandedPartes)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedPartes(newExpanded)
  }
  
  if (usosEspecificos.length === 0) {
    // Fallback para dados básicos
    const hasBasicData = plant.parteUsada || plant.usos || plant.metodoPreparacao || plant.metodoExtracao

    if (!hasBasicData) return null
    
    return (
      <div className={styles.partesUsadasSection}>
        <div className={styles.partesUsadasRow}>
          <dt className={styles.partesUsadasLabel}>Partes Usadas e Aplicações</dt>
          <dd className={styles.partesUsadasContent}>
            {plant.parteUsada && (
              <div className={styles.parteItem}>
                <div className={styles.parteHeader}>
                  <div className={styles.parteHeaderContent}>
                    <span className={styles.parteNome}>Partes Usadas</span>
                  </div>
                </div>
                <div className={styles.parteDetails}>
                  <div className={styles.parteDetailValue}>
                    {plant.parteUsada}
                  </div>
                </div>
              </div>
            )}
            
            {plant.usos && (
              <div className={styles.parteItem}>
                <div className={styles.parteHeader}>
                  <div className={styles.parteHeaderContent}>
                    <span className={styles.parteNome}>Usos Tradicionais</span>
                  </div>
                </div>
                <div className={styles.parteDetails}>
                  <div className={styles.parteDetailValue}>
                    {plant.usos}
                  </div>
                </div>
              </div>
            )}
            
            {plant.metodoPreparacao && (
              <div className={styles.parteItem}>
                <div className={styles.parteHeader}>
                  <div className={styles.parteHeaderContent}>
                    <span className={styles.parteNome}>Preparação</span>
                  </div>
                </div>
                <div className={styles.parteDetails}>
                  <div className={styles.parteDetailValue}>
                    {plant.metodoPreparacao}
                  </div>
                </div>
              </div>
            )}
            
            {plant.metodoExtracao && (
              <div className={styles.parteItem}>
                <div className={styles.parteHeader}>
                  <div className={styles.parteHeaderContent}>
                    <span className={styles.parteNome}>Extracção</span>
                  </div>
                </div>
                <div className={styles.parteDetails}>
                  <div className={styles.parteDetailValue}>
                    {plant.metodoExtracao}
                  </div>
                </div>
              </div>
            )}
          </dd>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.partesUsadasSection}>
      <div className={styles.partesUsadasRow}>
        <dt className={styles.partesUsadasLabel}>Partes Usadas e Aplicações Específicas</dt>
        <dd className={styles.partesUsadasContent}>
          {usosEspecificos.map((uso, index) => {
            const usoKey = `uso-${uso.id_uso_planta || index}`
            const isExpanded = expandedPartes.has(usoKey)
            
            return (
              <div key={usoKey} className={styles.parteItem}>
                <div 
                  className={styles.parteHeader}
                  onClick={() => toggleParte(usoKey)}
                >
                  <div className={styles.parteHeaderContent}>
                    <span className={styles.parteNome}>{uso.parte_usada}</span>
                    <span className={styles.parteToggle}>
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                  {uso.observacoes && (
                    <div className={styles.parteObservacoes}>{uso.observacoes}</div>
                  )}
                </div>
                
                {isExpanded && (
                  <div className={styles.parteDetails}>
                    {/* Usos Tradicionais */}
                    {uso.indicacoes && uso.indicacoes.length > 0 && (
                      <div className={styles.parteDetailItem}>
                        <div className={styles.parteDetailLabel}>Usos Tradicionais</div>
                        <div className={styles.parteDetailValue}>
                          <div className={styles.tagsList}>
                            {uso.indicacoes.map((ind, idx) => (
                              <span key={idx} className={styles.tag}>
                                {ind.descricao}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Métodos de Preparação */}
                    {uso.metodos_preparacao && uso.metodos_preparacao.length > 0 && (
                      <div className={styles.parteDetailItem}>
                        <div className={styles.parteDetailLabel}>Preparação Tradicional</div>
                        <div className={styles.parteDetailValue}>
                          <div className={styles.tagsList}>
                            {uso.metodos_preparacao.map((mp, idx) => (
                              <span key={idx} className={styles.tag}>
                                {mp.descricao}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Métodos de Extração */}
                    {uso.metodos_extracao && uso.metodos_extracao.length > 0 && (
                      <div className={styles.parteDetailItem}>
                        <div className={styles.parteDetailLabel}>Extracção Científica</div>
                        <div className={styles.parteDetailValue}>
                          <div className={styles.tagsList}>
                            {uso.metodos_extracao.map((me, idx) => (
                              <span key={idx} className={styles.tag}>
                                {me.descricao}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </dd>
      </div>
    </div>
  )
}

// Componente melhorado para mostrar autores
function AutoresDetalhados({ plant }: { plant: Plant }) {
  const autores = plant.autores_detalhados || []
  
  if (autores.length === 0 && plant.afiliacao) {
    return (
      <div className={styles.autoresSection}>
        <div className={styles.autoresRow}>
          <dt className={styles.autoresLabel}>Afiliação</dt>
          <dd className={styles.autoresContent}>
            <div className={styles.afiliacaoSimples}>
              {plant.afiliacao}
            </div>
          </dd>
        </div>
      </div>
    )
  }

  if (autores.length === 0) return null

  return (
    <div className={styles.autoresSection}>
      <div className={styles.autoresRow}>
        <dt className={styles.autoresLabel}>Autores e Afiliações</dt>
        <dd className={styles.autoresContent}>
          {autores.map((autor, index) => (
            <div key={autor.id_autor || index} className={styles.autorItem}>
              <div className={styles.autorNome}>{autor.nome_autor}</div>
              
              {autor.afiliacao && (
                <div className={styles.autorAfiliacao}>
                  {autor.afiliacao}
                  {autor.sigla_afiliacao && (
                    <span className={styles.afiliacaoSigla}> ({autor.sigla_afiliacao})</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </dd>
      </div>
    </div>
  )
}

// Componente de referências ultra simples - apenas emoji + texto
function ReferenciasDetalhadas({ plant }: { plant: Plant }) {
  const referencias = plant.referencias_detalhadas || []
  
  // Se não tem referências detalhadas, mostra a referência simples
  if (referencias.length === 0 && plant.referencia) {
    return (
      <div className={styles.referenciasSection}>
        <div className={styles.referenciasRow}>
          <dt className={styles.referenciasLabel}>Referências</dt>
          <dd className={styles.referenciasContent}>
            <div className={styles.referenciaSimples}>
              {plant.referencia}
            </div>
          </dd>
        </div>
      </div>
    )
  }

  if (referencias.length === 0) return null

  const getTipoIcon = (tipo: string): string => {
    switch (tipo) {
      case 'URL': return '🔗'
      case 'Artigo': return '📄'
      case 'Livro': return '📚'
      case 'Tese': return '🎓'
      default: return '📋'
    }
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className={styles.referenciasSection}>
      <div className={styles.referenciasRow}>
        <dt className={styles.referenciasLabel}>
          Referências ({referencias.length})
        </dt>
        <dd className={styles.referenciasContent}>
          <div className={styles.referenciasList}>
            {referencias
              .sort((a, b) => {
                // Ordenar por ano (mais recente primeiro), depois por título
                if (a.ano && b.ano) {
                  return parseInt(b.ano) - parseInt(a.ano)
                }
                if (a.ano && !b.ano) return -1
                if (!a.ano && b.ano) return 1
                
                const tituloA = a.titulo_referencia || a.link_referencia || ''
                const tituloB = b.titulo_referencia || b.link_referencia || ''
                return tituloA.localeCompare(tituloB)
              })
              .map((ref, index) => {
                const titulo = ref.titulo_referencia || ref.link_referencia
                const isUrl = ref.tipo_referencia === 'URL' || isValidUrl(ref.link_referencia || '')
                
                return (
                  <div key={ref.id_referencia || index} className={styles.referenciaItem}>
                    <span className={styles.referenciaIcon}>
                      {getTipoIcon(ref.tipo_referencia || 'Outros')}
                    </span>
                    
                    <div className={styles.referenciaTexto}>
                      {isUrl && ref.link_referencia ? (
                        <a 
                          href={ref.link_referencia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.referenciaLink}
                        >
                          {titulo}
                        </a>
                      ) : (
                        titulo
                      )}
                    </div>
                    
                    {ref.ano && (
                      <span className={styles.referenciaAno}>
                        {ref.ano}
                      </span>
                    )}
                  </div>
                )
              })}
          </div>
        </dd>
      </div>
    </div>
  )
}

export function PlantDetails({ plant }: PlantDetailsProps) {
  const { translate } = useLanguage()
  const [showArticle, setShowArticle] = useState(false)
  const [imageGalleryError, setImageGalleryError] = useState<string | null>(null)

  // 🔥 CORREÇÃO: Verificar e processar imagens da planta
  const plantImages: PlantImage[] = plant.imagens?.map(img => ({
    id_imagem: img.id_imagem,
    nome_arquivo: img.nome_arquivo,
    ordem: img.ordem,
    legenda: img.legenda || '',
    url: img.url,
    data_upload: img.data_upload
  })) || []

  console.log(`📸 PlantDetails: Processando ${plantImages.length} imagens para planta ${plant.id}:`, plantImages)

  // Artigo simulado para demonstração
  const sampleArticle = `
    <h2>Estudo sobre ${plant.nome || plant.nomes_comuns?.join(', ') || 'Esta planta'} (<em>${plant.nomeCientifico}</em>)</h2>
    
    <p><strong>Resumo:</strong> Este estudo investiga as propriedades medicinais de <em>${
      plant.nomeCientifico
    }</em>, conhecida popularmente como ${
      plant.nomes_comuns?.join(', ') || plant.nome || 'esta espécie'
    }, uma planta da família <strong>${plant.familia?.toUpperCase() || 'não especificada'}</strong> encontrada em ${
      plant.localColheita || plant.provincias_detalhadas?.map(p => p.nome_provincia).join(', ') || 'várias regiões'
    }. Foram analisados os compostos ativos presentes em ${
      plant.parteUsada || plant.usos_especificos?.map(u => u.parte_usada).join(', ') || 'diferentes partes da planta'
    } e sua eficácia no tratamento de diversas condições de saúde.</p>
    
    <h3>Introdução</h3>
    <p>${
      plant.nomes_comuns?.join(', ') || plant.nome || 'Esta espécie'
    } tem sido utilizada tradicionalmente por comunidades locais para o tratamento de ${
      plant.usos || plant.usos_especificos?.flatMap(u => u.indicacoes.map(i => i.descricao)).join(', ') || 'diversas condições'
    }. Este estudo visa validar cientificamente esses usos tradicionais através de análises fitoquímicas e ensaios farmacológicos.</p>
    
    <h3>Metodologia</h3>
    <p>Amostras de ${
      plant.parteUsada || plant.usos_especificos?.map(u => u.parte_usada).join(', ') || 'partes da planta'
    } foram coletadas em ${
      plant.localColheita || plant.provincias_detalhadas?.map(p => p.nome_provincia).join(', ') || 'campo'
    } e processadas utilizando ${
      plant.metodoExtracao || plant.usos_especificos?.flatMap(u => u.metodos_extracao.map(m => m.descricao)).join(', ') || 'métodos padronizados de extração'
    }. Os extratos foram analisados por cromatografia e espectrometria de massa para identificação dos compostos bioativos.</p>
    
    <h3>Resultados</h3>
    <p>As análises revelaram a presença de ${
      plant.composicaoQuimica || 'diversos compostos bioativos'
    }, compostos conhecidos por suas propriedades ${
      plant.propriedadesFarmacologicas || 'terapêuticas'
    }. Os ensaios in vitro e in vivo confirmaram a eficácia da planta no tratamento das condições mencionadas nos usos tradicionais.</p>
    
    <h3>Discussão</h3>
    <p>Os resultados obtidos corroboram com o conhecimento tradicional sobre o uso de ${
      plant.nomes_comuns?.join(', ') || plant.nome || 'esta espécie'
    }. A presença de compostos bioativos específicos explica os mecanismos de ação observados nos tratamentos tradicionais.</p>
    
    <h3>Conclusão</h3>
    <p>Este estudo valida cientificamente o uso tradicional de ${
      plant.nomes_comuns?.join(', ') || plant.nome || 'esta espécie'
    } e abre caminho para o desenvolvimento de novos medicamentos baseados em seus compostos bioativos.</p>
    
    <p><strong>Palavras-chave:</strong> ${
      plant.nomes_comuns?.join(', ') || plant.nome || 'planta medicinal'
    }, <em>${plant.nomeCientifico}</em>, fitoquímica, etnofarmacologia</p>
    
    <p><strong>Referência:</strong> ${
      plant.referencia || plant.referencias_detalhadas?.map(r => r.titulo_referencia || r.link_referencia).join('; ') || 'Referência não disponível'
    }</p>
  `

  return (
    <div className={styles.plantDetails}>
      <div className={styles.detailsGrid}>
        <div className={styles.plantImageSection}>
          <div className={styles.plantImageCard}>
            {/* 🔥 GALERIA DE IMAGENS MELHORADA */}
            {imageGalleryError ? (
              <div className={styles.galleryError}>
                <div className={styles.errorIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <p>Erro ao carregar galeria: {imageGalleryError}</p>
                <button 
                  onClick={() => setImageGalleryError(null)}
                  className={styles.retryButton}
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <PlantImageGallery 
                plantId={plant.id}
                plantName={plant.nomes_comuns?.join(', ') || plant.nome || plant.nomeCientifico}
                images={plantImages}
                className={styles.plantGallery}
              />
            )}
            
            <div className={styles.plantImageInfo}>
              <h4 className={styles.plantName}>
                {plant.nomes_comuns?.join(' • ') || plant.nome || 'Nome não disponível'}
              </h4>
              
              <p className={styles.plantFamily}>{plant.familia?.toUpperCase()}</p>
              
              <p className={styles.plantScientific}>
                <em>{plant.nomeCientifico}</em>
              </p>
            </div>
          </div>
        </div>

        <div className={styles.plantInfoSection}>
          {showArticle ? (
            <div className={styles.articleCard}>
              <div className={styles.articleHeader}>
                <h3 className={styles.articleTitle}>Artigo Científico</h3>
                <button 
                  onClick={() => setShowArticle(false)}
                  className={styles.backButton}
                  aria-label="Voltar aos detalhes"
                >
                  ← Voltar aos detalhes
                </button>
              </div>
              <div className={styles.articleBody} dangerouslySetInnerHTML={{ __html: sampleArticle }}></div>
            </div>
          ) : (
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <h3 className={styles.infoTitle}>{translate("details.info")}</h3>
              </div>

              <div className={styles.infoList}>
                <DetailRow 
                  label={translate("search.scientificName")} 
                  value={plant.nomeCientifico}
                  isScientific={true}
                />
                
                <DetailRow 
                  label={translate("plant.family")} 
                  value={plant.familia?.toUpperCase() || plant.familia}
                />
                
                <DetailRow 
                  label={translate("plant.commonName")} 
                  value={plant.nomes_comuns?.join(', ') || plant.nome}
                />
                
                <DetailRow label={translate("plant.location")} value={plant.localColheita} />
                <DetailRow label={translate("plant.specimenNumber")} value={plant.numeroExcicata} />
                
                <DetailRow label={translate("plant.composition")} value={plant.composicaoQuimica} />
                <DetailRow label={translate("plant.properties")} value={plant.propriedadesFarmacologicas} />
                
                {/* Seções melhoradas */}
                <ParteUsadaCorrelacao plant={plant} />
                <AutoresDetalhados plant={plant} />
                
                {/* Nova seção de referências detalhadas */}
                <ReferenciasDetalhadas plant={plant} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, isScientific = false }: { label: string; value?: string; isScientific?: boolean }) {
  if (!value) return null
  
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd className={`${styles.detailValue} ${isScientific ? styles.scientificName : ''}`}>
        {isScientific ? <em>{value}</em> : value}
      </dd>
    </div>
  )
}