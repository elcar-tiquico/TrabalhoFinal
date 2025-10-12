"use client"
import Link from "next/link"
import Image from "next/image"
import styles from "./header.module.css"

export function Header() {
  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Image
                src="/images/logo isctem.png" // caminho para seu logo na pasta public
                alt="PhytoMoz Logo"
                width={110}
                height={55}
              />
            </div>
            <span className={styles.logoText}>PhytoMoz</span>
          </Link>
          
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <Link href="/referencias" className={styles.navLink}>
              Referências
            </Link>
            <Link href="/admin" className={styles.navLink}>
              Admin
            </Link>
          </nav>

          <button className={styles.mobileMenuButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={styles.mobileMenuIcon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}