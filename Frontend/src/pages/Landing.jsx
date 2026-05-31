import {
  Features,
  FinalCTA,
  Footer,
  Hero,
  Navbar,
  ProductHighlight,
} from '@/features/landing'

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <ProductHighlight />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
