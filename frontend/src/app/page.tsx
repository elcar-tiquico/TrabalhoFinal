import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SearchSection } from "@/components/search-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main>
      <Header />
      <HeroSection />
      <SearchSection />
      <Footer />
    </main>
  )
}
