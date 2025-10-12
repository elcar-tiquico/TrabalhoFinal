// hero-section.tsx
"use client"

import Link from "next/link"
import styles from "./hero-section.module.css"

export function HeroSection() {
  const scrollToSearchForm = () => {
    const searchSection = document.querySelector('[data-search-form]')
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className={styles.heroSection}>
      <div className="container">
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Base de Dados das Plantas Medicinais de Moçambique</h1>
          <p className={styles.heroSubtitle}>
            Explore o conhecimento tradicional e científico sobre plantas medicinais 
          </p>
          <div className={styles.heroButtons}>
            <button 
              onClick={scrollToSearchForm}
              className={styles.primaryButton}
            >
              Explorar Plantas
            </button>
            <Link href="/sobre" className={styles.secondaryButton}>
              Sobre o Projeto
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}