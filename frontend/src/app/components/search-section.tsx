"use client"

import { SearchForm } from "@/components/search-form"
import { ResultsTable } from "@/components/results-table"
import { SearchProvider } from "@/context/search-context"
import styles from "./search-section.module.css"

export function SearchSection() {
  return (
    <div className="container">
      <div className={styles.searchSection} data-search-form>
        <SearchProvider>
          <div className={styles.searchGrid}>
            <div className={styles.searchFormContainer}>
              <SearchForm />
            </div>
            <div className={styles.resultsContainer}>
              <ResultsTable />
            </div>
          </div>
        </SearchProvider>
      </div>
    </div>
  )
}