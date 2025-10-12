"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "pt" | "xangana" | "xopeee"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  translate: (key: string) => string
}

const translations = {
  pt: {
    "search.title": "Buscar Plantas",
    "search.popularName": "Nome Popular",
    "search.scientificName": "Nome Científico",
    "search.traditionalUse": "Uso Tradicional",
    "search.author": "Autor",
    "search.location": "Local de Observação",
    "search.placeholder.popular": "Ex: Moringa...",
    "search.placeholder.scientific": "Ex: Moringa oleifera...",
    "search.placeholder.author": "Ex: Silva, Oliveira...",
    "search.recording": "Gravando...",
    "search.empty": "Deixe os campos vazios para buscar todas as plantas.",
    "search.clear": "Limpar",
    "search.button": "Buscar",
    "results.title": "Resultados",
    "results.searching": "Buscando plantas...",
    "results.searchPrompt": "Faça uma busca",
    "results.noResults": "Nenhum resultado encontrado",
    "results.tryAgain": "Tente outros termos de busca ou deixe os campos vazios para ver todas as plantas.",
    "results.found": "resultado encontrado",
    "results.found_plural": "resultados encontrados",
    "results.download": "Baixar",
    "results.read": "Ler",
    "details.info": "Informações da Planta",
    "details.downloadArticle": "Baixar Artigo",
    "details.readArticle": "Ler Artigo",
    "details.moreDetails": "Mais Detalhes",
    "plant.family": "Família",
    "plant.commonName": "Nome Popular",
    "plant.location": "Local de Colheita",
    "plant.specimenNumber": "Informações Adicionais",
    "plant.partUsed": "Parte Utilizada",
    "plant.preparation": "Método de Preparação",
    "plant.uses": "Usos Tradicionais",
    "plant.extraction": "Método de Extração",
    "plant.composition": "Composição Química",
    "plant.properties": "Propriedades Farmacológicas",
    "plant.affiliation": "Afiliação",
    "plant.reference": "Referência",
  },
  xangana: {
    "search.title": "Lavisisa Svimbyani",
    "search.popularName": "Vito ra ndhavuko",
    "search.scientificName": "Vito ra sayense",
    "search.traditionalUse": "Matirhiselo ya ndhavuko",
    "search.author": "Mutsari",
    "search.location": "Ndhawu yo kuma",
    "search.placeholder.popular": "Xik: Carqueja, Samambaia...",
    "search.placeholder.scientific": "Xik: Baccharis, Schinus...",
    "search.placeholder.author": "Xik: Silva, Oliveira...",
    "search.recording": "Ku rhekoda...",
    "search.empty": "Tshika swivandla leswi nga hava nchumu ku lavisisa svimbyani hinkwasvo.",
    "search.clear": "Basisa",
    "search.button": "Lavisisa",
    "results.title": "Mbuyelo",
    "results.searching": "Ku lavisisa svimbyani...",
    "results.searchPrompt": "Endla vulavisisi",
    "results.noResults": "Ku hava mbuyelo lowu kumiweke",
    "results.tryAgain":
      "Ringeta marito man'wana yo lavisisa kumbe u tshika swivandla swi nga ri na nchumu ku vona svimbyani hinkwasvo.",
    "results.found": "mbuyelo lowu kumiweke",
    "results.found_plural": "mimbuyelo leyi kumiweke",
    "results.download": "Koxela",
    "results.read": "Hlaya",
    "details.info": "Vuxokoxoko bya Ximbyani",
    "details.downloadArticle": "Koxela Atikili",
    "details.readArticle": "Hlaya Atikili",
    "details.moreDetails": "Vuxokoxoko Byo tala",
    "plant.family": "Ndyangu",
    "plant.commonName": "Vito ra ndhavuko",
    "plant.location": "Ndhawu yo kuma",
    "plant.specimenNumber": "Nomboro ya xikombiso",
    "plant.partUsed": "Xiphemu lexi tirhisiwaka",
    "plant.preparation": "Ndlela yo lulamisela",
    "plant.uses": "Matirhiselo ya ndhavuko",
    "plant.extraction": "Ndlela yo humesa",
    "plant.composition": "Vumbekelo bya xikhemikhali",
    "plant.properties": "Swihlawulekisi swa maphilungana",
    "plant.affiliation": "Vuhlanganisi",
    "plant.reference": "Xikomiso",
  },
  xopeee: {
    "search.title": "Mbuyelo",
    "search.popularName": "3 swimbiyani leswi kumiweke",
    "search.scientificName": "Xangana",
    "search.traditionalUse": "Matirhiselo ya ndhavuko",
    "search.author": "Mutsari",
    "search.location": "Ndhawu yo kuma",
    "search.placeholder.popular": "Xik: Carqueja, Samambaia...",
    "search.placeholder.scientific": "Xik: Baccharis, Schinus...",
    "search.placeholder.author": "Xik: Silva, Oliveira...",
    "search.recording": "Ku rhekoda...",
    "search.empty": "Tshika swivandla leswi nga hava nchumu ku lavisisa svimbyani hinkwasvo.",
    "search.clear": "Basisa",
    "search.button": "Lavisisa",
    "results.title": "Mbuyelo",
    "results.searching": "Ku lavisisa svimbyani...",
    "results.searchPrompt": "Endla vulavisisi",
    "results.noResults": "Ku hava mbuyelo lowu kumiweke",
    "results.tryAgain":
      "Ringeta marito man'wana yo lavisisa kumbe u tshika swivandla swi nga ri na nchumu ku vona svimbyani hinkwasvo.",
    "results.found": "mbuyelo lowu kumiweke",
    "results.found_plural": "mimbuyelo leyi kumiweke",
    "results.download": "Koxela",
    "results.read": "Hlaya",
    "details.info": "Vuxokoxoko bya Ximbyani",
    "details.downloadArticle": "Koxela Atikili",
    "details.readArticle": "Hlaya Atikili",
    "details.moreDetails": "Vuxokoxoko Byo tala",
    "plant.family": "Ndyangu",
    "plant.commonName": "Vito ra ndhavuko",
    "plant.location": "Ndhawu yo kuma",
    "plant.specimenNumber": "Nomboro ya xikombiso",
    "plant.partUsed": "Xiphemu lexi tirhisiwaka",
    "plant.preparation": "Ndlela yo lulamisela",
    "plant.uses": "Matirhiselo ya ndhavuko",
    "plant.extraction": "Ndlela yo humesa",
    "plant.composition": "Vumbekelo bya xikhemikhali",
    "plant.properties": "Swihlawulekisi swa maphilungana",
    "plant.affiliation": "Vuhlanganisi",
    "plant.reference": "Xikomiso",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("pt")

  const translate = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, translate }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
