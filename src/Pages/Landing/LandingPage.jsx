import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Landing.css'
import ContactPage from './components/ContactPage'
import DemoRequestSection from './components/DemoRequestSection'
import FeaturesSection from './components/FeaturesSection'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import Navbar from './components/Navbar'
import SplashScreen from './components/SplashScreen'
import SystemSlider from './components/SystemSlider'
import { useTheme } from './hooks/useTheme'

function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const [isSplashVisible, setIsSplashVisible] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = useCallback(
    (href) => {
      navigate(href)
    },
    [navigate],
  )

  useEffect(() => {
    const splashTimer = window.setTimeout(() => {
      setIsSplashVisible(false)
    }, 1600)

    return () => window.clearTimeout(splashTimer)
  }, [])

  useEffect(() => {
    if (isSplashVisible) {
      return
    }

    if (location.hash) {
      requestAnimationFrame(() => {
        document.querySelector(location.hash)?.scrollIntoView()
      })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [isSplashVisible, location])

  const isContactPage = location.pathname === '/contact'

  return (
    <main
      className="site-shell relative min-h-screen overflow-hidden bg-themeBg text-themeText"
      data-theme={theme}
      dir="rtl"
    >
      <div className="site-ambient pointer-events-none absolute inset-0 z-0" />
      <div className="site-glow site-glow-primary pointer-events-none absolute z-0" />
      <div className="site-glow site-glow-secondary pointer-events-none absolute z-0" />
      <div className="site-pattern pointer-events-none absolute inset-0 z-0" />
      <div className="site-scan pointer-events-none absolute inset-x-0 top-0 z-0 h-full" />

      {isSplashVisible && <SplashScreen theme={theme} />}
      <Navbar theme={theme} onThemeToggle={toggleTheme} onNavigate={handleNavigate} />
      {isContactPage ? (
        <ContactPage />
      ) : (
        <>
          <HeroSection />
          <SystemSlider />
          <FeaturesSection />
          <DemoRequestSection />
        </>
      )}
      <Footer theme={theme} onNavigate={handleNavigate} />
    </main>
  )
}

export default LandingPage
