import { useState } from 'react'
import lightLogo from '../../../assets/logos/new1.png'
import darkLogo from '../../../assets/logos/new2.png'
import { navItems } from '../data/landingData'
import ThemeToggle from './ThemeToggle'

const getRouteHref = (href) => {
  if (href === '#contact') {
    return '/contact'
  }

  if (href.startsWith('#')) {
    return `/${href}`
  }

  return href
}

function Navbar({ theme, onThemeToggle, onNavigate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const brandLogo = theme === 'dark' ? darkLogo : lightLogo

  const handleRouteClick = (event, href) => {
    const routeHref = getRouteHref(href)

    if (!routeHref.startsWith('/')) {
      return
    }

    event.preventDefault()
    setIsMenuOpen(false)
    onNavigate?.(routeHref)
  }

  return (
    <nav className="navbar-enter fixed inset-x-0 top-0 z-50 border-b border-themeBorder bg-themeSurface/90 backdrop-blur-xl">
      <ThemeToggle theme={theme} onToggle={onThemeToggle} />

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 pl-16 sm:px-6 sm:pl-24 lg:px-8">
        <a
          href="/"
          onClick={(event) => handleRouteClick(event, '/')}
          className="brand-mark flex min-w-0 items-center gap-2 text-right sm:gap-3"
        >
          <img
            src={brandLogo}
            alt="مدرسہ سافٹ ویئر"
            className="h-14 w-auto max-w-[15rem] object-contain sm:h-16 sm:max-w-[18rem]"
          />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item, index) => (
            <a
              key={item.label}
              href={getRouteHref(item.href)}
              onClick={(event) => handleRouteClick(event, item.href)}
              className="nav-link text-theme-nav font-semibold text-slate-600 transition hover:text-themePrimary dark:text-slate-300"
              style={{ animationDelay: `${120 + index * 80}ms` }}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            onClick={(event) => handleRouteClick(event, '/login')}
            className="rounded-md border border-themeBorder bg-themeSurface px-4 py-2 text-theme-button font-bold text-themeText shadow-card-theme transition hover:border-themePrimary hover:text-themePrimary"
          >
            لاگ اِن
          </a>
          <a
            href="/contact"
            onClick={(event) => handleRouteClick(event, '/contact')}
            className="rounded-md bg-themePrimary px-4 py-2 text-theme-button font-bold text-white shadow-card-theme transition hover:bg-themePrimaryHover"
          >
            ڈیمو بک کریں
          </a>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="menu-button grid size-10 place-items-center rounded-md border border-themeBorder bg-themeBg text-themeText shadow-card-theme transition hover:border-themePrimary hover:text-themePrimary md:hidden"
          aria-label="مینو کھولیں"
          aria-expanded={isMenuOpen}
        >
          <svg
            className="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 top-20 z-40 md:hidden">
          <button
            type="button"
            className="drawer-backdrop absolute inset-0 bg-slate-950/45"
            aria-label="مینو بند کریں"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="drawer-panel absolute right-0 top-0 h-[calc(100svh-5rem)] w-72 max-w-[82vw] border-l border-themeBorder bg-themeSurface p-5 text-right shadow-theme">
            <div className="mb-5 flex items-center justify-between border-b border-themeBorder pb-4">
              <p className="font-urdu text-theme-title font-bold text-themeText">
                مینو
              </p>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="grid size-9 place-items-center rounded-md border border-themeBorder bg-themeBg text-themeText transition hover:border-themePrimary hover:text-themePrimary"
                aria-label="مینو بند کریں"
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {navItems.map((item, index) => (
                <a
                  key={item.label}
                  href={getRouteHref(item.href)}
                  onClick={(event) => handleRouteClick(event, item.href)}
                  className="drawer-link block rounded-md border border-themeBorder bg-themeBg px-4 py-3 text-theme-button font-bold text-themeText transition hover:border-themePrimary hover:text-themePrimary"
                  style={{ animationDelay: `${140 + index * 70}ms` }}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <a
              href="/contact"
              onClick={(event) => handleRouteClick(event, '/contact')}
              className="mt-5 block rounded-md bg-themePrimary px-4 py-3 text-center text-theme-button font-bold text-white shadow-card-theme transition hover:bg-themePrimaryHover"
            >
              ڈیمو بک کریں
            </a>
            <a
              href="/login"
              onClick={(event) => handleRouteClick(event, '/login')}
              className="mt-3 block rounded-md border border-themeBorder bg-themeBg px-4 py-3 text-center text-theme-button font-bold text-themeText shadow-card-theme transition hover:border-themePrimary hover:text-themePrimary"
            >
              لاگ اِن
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
