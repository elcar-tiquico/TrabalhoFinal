"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/context/language-context"
import styles from "./language-switcher.module.css"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar o dropdown quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const languages = [
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "xangana", name: "Changana", flag: "🇲🇿" },
    { code: "xopeee", name: "Macua", flag: "🇲🇿" },
  ]

  const currentLanguage = languages.find((lang) => lang.code === language)

  return (
    <div className={styles.languageSwitcher} ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.switcherButton}>
        <span className={styles.flag}>{currentLanguage?.flag}</span>
        <span className={styles.languageName}>{currentLanguage?.name}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${styles.chevron} ${isOpen ? styles.chevronUp : ""}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as "pt" | "xangana" | "xopeee")
                setIsOpen(false)
              }}
              className={`${styles.languageOption} ${language === lang.code ? styles.activeOption : ""}`}
            >
              <span className={styles.flag}>{lang.flag}</span>
              <span>{lang.name}</span>
              {language === lang.code && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.checkIcon}
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
