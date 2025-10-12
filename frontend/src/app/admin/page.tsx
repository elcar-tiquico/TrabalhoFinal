"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import styles from "./landing.module.css"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId.replace('#', ''))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className={styles.landingPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          {/* Header */}
          <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
            <div className={styles.container}>
              <div className={styles.headerContent}>
                <div className={styles.logoSection}>
                  <div className={styles.logoContainer}>
                    <Image
                      src="/images/logo isctem.png"
                      alt="Logo ISCTEM"
                      width={60}
                      height={60}
                      className={styles.logoImage}
                      priority
                    />
                  </div>
                  <div className={styles.logoText}>
                    <h1>ISCTEM</h1>
                    <p>Instituto Superior de Ciências e Tecnologia de Moçambique</p>
                  </div>
                </div>
                
                <nav className={styles.navigation}>
                  <a 
                    href="#sobre" 
                    className={styles.navLink}
                    onClick={(e) => handleSmoothScroll(e, 'sobre')}
                  >
                    Sobre
                  </a>
                  <a 
                    href="#sistema" 
                    className={styles.navLink}
                    onClick={(e) => handleSmoothScroll(e, 'sistema')}
                  >
                    Sistema
                  </a>
                  <a 
                    href="#contacto" 
                    className={styles.navLink}
                    onClick={(e) => handleSmoothScroll(e, 'contacto')}
                  >
                    Contacto
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Hero Main Content */}
          <div className={styles.container}>
            <div className={styles.heroMain}>
              <div className={styles.heroText}>
                <h1 className={styles.heroTitle}>
                  Base de Dados de 
                  <span className={styles.titleHighlight}> Plantas Medicinais</span>
                  <br />
                  de Moçambique
                </h1>
                <p className={styles.heroSubtitle}>
                  Desenvolvido pelo curso de farmácia do ISCTEM para preservar e disponibilizar o conhecimento 
                  tradicional sobre plantas medicinais com suporte a línguas locais.
                </p>
                <p>.</p>
                <div className={styles.heroButtons}>
                  <Link href="/admin/login" className={styles.btnPrimary}>
                    <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z"/>
                    </svg>
                    Acesso Administrativo
                  </Link>
                </div>
              </div>
              
              <div className={styles.heroVisual}>
                <div className={styles.floatingCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className={styles.cardTitle}>Sistema de Plantas</span>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.plantItem}>
                      <div className={styles.plantIcon}>🌿</div>
                      <div className={styles.plantInfo}>
                        <h4>Warburgia salutaris</h4>
                        <p>Xibaha (Changana)</p>
                      </div>
                    </div>
                    <div className={styles.plantItem}>
                      <div className={styles.plantIcon}>🍃</div>
                      <div className={styles.plantInfo}>
                        <h4>Moringa oleifera</h4>
                        <p>Moringa</p>
                      </div>
                    </div>
                    <div className={styles.plantItem}>
                      <div className={styles.plantIcon}>🌱</div>
                      <div className={styles.plantInfo}>
                        <h4>Aloe vera</h4>
                        <p>Babosa</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="sistema" className={styles.features}>
        <div className={styles.container}>
          <div className={styles.featuresHeader}>
            <h2 className={styles.sectionTitle}>Funcionalidades do Sistema</h2>
            {/* <p className={styles.sectionSubtitle}>
              Uma plataforma completa para gestão e consulta de informações sobre plantas medicinais
            </p> */}
          </div>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L1 9L12 15L21 9V16H23V9L12 3ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
                </svg>
              </div>
              <h3>Base de Dados Estruturada</h3>
              <p>Informações organizadas e categorizadas sobre plantas medicinais com dados científicos validados.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.87 15.07L10.33 12.56L10.36 12.53C12.1 10.59 13.34 8.36 14.07 6H17V4H10V2H8V4H1V6H12.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8H4.69C5.42 9.63 6.42 11.17 7.67 12.56L2.58 17.58L4 19L9 14L12.11 17.11L12.87 15.07ZM18.5 10H16.5L12 22H14L15.12 19H19.87L21 22H23L18.5 10ZM15.88 17L17.5 12.67L19.12 17H15.88Z"/>
                </svg>
              </div>
              <h3>Suporte Multilíngue</h3>
              <p>Interface disponível em português e línguas locais para maior acessibilidade.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5C16 11.11 15.41 12.59 14.44 13.73L14.71 14H15.5L20.5 19L19 20.5L14 15.5V14.71L13.73 14.44C12.59 15.41 11.11 16 9.5 16A6.5 6.5 0 0 1 3 9.5A6.5 6.5 0 0 1 9.5 3M9.5 5C7 5 5 7 5 9.5S7 14 9.5 14S14 12 14 9.5S12 5 9.5 5Z"/>
                </svg>
              </div>
              <h3>Pesquisa Avançada</h3>
              <p>Busca por nome científico, nome local, usos medicinais e outros atributos.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V10H17V12ZM17 16H7V14H17V16ZM17 8H7V6H17V8Z"/>
                </svg>
              </div>
              <h3>Gestão de Conteúdo</h3>
              <p>Painel administrativo para adicionar, editar e validar informações sobre plantas.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H9V3H15V9H21ZM3 19V5H1V19C1 20.1 1.9 21 3 21H17V19H3Z"/>
                </svg>
              </div>
              <h3>Documentação Científica</h3>
              <p>Referências bibliográficas e estudos científicos associados a cada planta.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7.5 20 8 20 8 20C8 20 8.75 16.25 8.75 16.25C10.5 14.5 14.25 13.25 17 8Z"/>
                </svg>
              </div>
              <h3>Preservação Cultural</h3>
              <p>Conservação do conhecimento tradicional sobre medicina natural moçambicana.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className={styles.about}>
        <div className={styles.container}>
          <div className={styles.aboutContent}>
            <div className={styles.aboutText}>
              <h2 className={styles.sectionTitle}>Sobre o Projecto</h2>
              <p className={styles.aboutDescription}>
                Este sistema foi desenvolvido como parte do trabalho de licenciatura em 
                Engenharia Informática no ISCTEM, com o objectivo de criar uma base de dados 
                estruturada de plantas medicinais utilizadas em Moçambique.
              </p>
              <p className={styles.aboutDescription}>
                O projecto visa preservar o conhecimento tradicional sobre medicina natural, 
                tornando-o acessível através de uma plataforma digital moderna que suporta 
                tanto português quanto línguas locais.
              </p>
              
              <div className={styles.aboutStats}>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>100+</div>
                  <div className={styles.statLabel}>Plantas Catalogadas</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>3</div>
                  <div className={styles.statLabel}>Línguas Suportadas</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>2025</div>
                  <div className={styles.statLabel}>Ano de Desenvolvimento</div>
                </div>
              </div>
            </div>
            
            <div className={styles.aboutVisual}>
              <div className={styles.aboutCard}>
                <div className={styles.aboutCardHeader}>
                  <h3>Desenvolvido por:</h3>
                </div>
                <div className={styles.aboutCardContent}>
                  <div className={styles.developerInfo}>
                    <h4>Elcar Tíquico Francisco Macuácua</h4>
                    <p>Estudante de Engenharia Informática</p>
                    <p>ISCTEM - 2025</p>
                  </div>
                  <div className={styles.isctemInfo}>
                    <h4>Curso de Farmácia e Controle de Qualidade de Medicamentos</h4>
                    {/* <p>do</p> */}
                    <p>ISCTEM - 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Pronto para começar?</h2>
            <p className={styles.ctaSubtitle}>
              Aceda ao painel administrativo para gerir o conteúdo do sistema
            </p>
            <Link href="/admin/login" className={styles.ctaButton}>
              <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 17L15 12L10 7V17Z"/>
              </svg>
              Aceder Sistema
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <div className={styles.footerLogo}>
                <div className={styles.footerLogoIcon}>
                    <Image
                      src="/images/logo isctem.png"
                      alt="Logo ISCTEM"
                      width={50}
                      height={50}
                      className={styles.footerLogoImage}
                      priority
                    />
                </div>
                <div>
                  <h3>ISCTEM</h3>
                  <p>Instituto Superior de Ciências e Tecnologia de Moçambique</p>
                  <p>Fundado em 1996 pela SOPREL</p>
                </div>
              </div>
            </div>
            
            <div className={styles.footerSection}>
              <h3>Sistema</h3>
              <p>Base de Dados de Plantas Medicinais</p>
              <p>Desenvolvido em 2025</p>
            </div>
            
            <div className={styles.footerSection}>
              <h3>Contacto</h3>
              <p>Maputo, Moçambique</p>
              <p>info@isctem.ac.mz</p>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p>&copy; 2025 ISCTEM. Todos os direitos reservados.</p>
            <p>Desenvolvido por Elcar Tíquico Francisco Macuácua</p>
          </div>
        </div>
      </footer>
    </div>
  )
}