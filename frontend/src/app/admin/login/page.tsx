// D:\Elcar\Projecto\frontend\src\app\admin\login\page.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { authAPI } from "../../../lib/api/auth"
import styles from "./login.module.css"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await authAPI.login({ email, password })
      router.push("/admin/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro durante o login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <div>
            {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.logoIcon}
            >
              <path d="M6 3v12"></path>
              <path d="M18 9a3 3 0 0 0-3-3H7"></path>
              <path d="M3 9a3 3 0 0 0 3 3h11"></path>
              <path d="M18 21a3 3 0 0 1-3-3H7"></path>
              <path d="M3 15a3 3 0 0 1 3-3h11"></path>
            </svg> */}
              <Image
                src="/images/logo isctem.png"
                alt="Logo ISCTEM"
                width={200}
                height={100}
                className={styles.footerLogoImage}
                priority
               />  
          </div>
        </div>
        <h2 className={styles.title}>PhytoMoz - Sistema de Plantas Medicinais</h2>
        <p className={styles.subtitle}>Painel Administrativo</p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.formBox}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorMessage}>
                <div className={styles.errorIcon}>
                  <svg
                    className={styles.errorSvg}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className={styles.errorText}>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="admin@sistema.com"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Senha
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Digite sua senha"
                />
              </div>
            </div>

            {/* <div className={styles.formOptions}>
              <div className={styles.rememberMe}>
                <input id="remember-me" name="remember-me" type="checkbox" className={styles.checkbox} />
                <label htmlFor="remember-me" className={styles.checkboxLabel}>
                  Lembrar-me
                </label>
              </div>

            </div> */}

            <div>
              <button type="submit" disabled={isLoading} className={styles.loginButton}>
                {isLoading ? (
                  <>
                    <svg
                      className={styles.loadingSpinner}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className={styles.spinnerBg}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className={styles.spinnerPath}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>

          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <div className={styles.dividerText}>Ou volte para</div>
            <div className={styles.dividerLine}></div>
          </div>

          <div className={styles.homeLink}>
            <Link href="/" className={styles.homeLinkButton}>
              Página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}