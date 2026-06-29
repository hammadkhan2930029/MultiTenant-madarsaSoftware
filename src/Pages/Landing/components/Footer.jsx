import lightLogo from '../../../assets/logos/new1.png'
import darkLogo from '../../../assets/logos/new2.png'
import { footerLinks } from '../data/landingData'

const getRouteHref = (href) => {
  if (href === '#contact') {
    return '/contact'
  }

  if (href.startsWith('#')) {
    return `/${href}`
  }

  return href
}

function Footer({ theme, onNavigate }) {
  const brandLogo = theme === 'dark' ? darkLogo : lightLogo

  const handleRouteClick = (event, href) => {
    const routeHref = getRouteHref(href)

    if (!routeHref.startsWith('/')) {
      return
    }

    event.preventDefault()
    onNavigate?.(routeHref)
  }

  return (
    <footer className="footer-shell relative z-10 border-t border-themeBorder bg-themeSurface/75 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-7 text-right sm:px-6 lg:px-8">
        <div className="footer-cta soft-panel rounded-xl border border-themeBorder bg-themeBg/80 p-5 shadow-card-theme sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="footer-cta-kicker text-theme-body font-bold text-themePrimary">
                مدرسہ مینجمنٹ کو آج ہی آسان بنائیں
              </p>
              <h2 className="footer-cta-title mt-2 font-urdu text-theme-title font-bold text-themeText">
                مکمل ڈیمو دیکھیں اور اپنی ٹیم کے لیے بہترین flow منتخب کریں۔
              </h2>
            </div>
            <a
              href="/contact"
              onClick={(event) => handleRouteClick(event, '/contact')}
              className="footer-cta-button hero-action rounded-md bg-themePrimary px-5 py-2.5 text-center text-theme-button font-bold text-white shadow-card-theme transition hover:bg-themePrimaryHover"
            >
              ڈیمو درخواست دیں
            </a>
          </div>
        </div>

        <div className="grid gap-7 py-7 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="flex flex-col items-start gap-3 text-right">
              <img
                src={brandLogo}
                alt="مدرسہ سافٹ ویئر"
                className="h-14 w-auto max-w-[15rem] object-contain sm:h-16 sm:max-w-[18rem]"
              />
              <div>
                <p className="text-theme-kicker text-slate-500 dark:text-slate-400">
                  جدید مدرسہ مینجمنٹ کے لیے مکمل سافٹ ویئر حل۔
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-theme-body font-black text-themeText">
              فوری لنکس
            </p>
            <div className="grid gap-2.5">
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={getRouteHref(link.href)}
                  onClick={(event) => handleRouteClick(event, link.href)}
                  className=" text-xl font-bold text-slate-600 transition hover:text-themePrimary dark:text-slate-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className=" mb-3 text-theme-body font-black text-themeText">رابطہ</p>
            <div className=" grid gap-2.5 text-xl font-bold text-slate-600 dark:text-slate-300">
              <a
                href="mailto:info@madrasasoftware.com"
                className=" transition hover:text-themePrimary"
                dir="ltr"
              >
                info@madrasasoftware.com
              </a>
              <a
                href="tel:+923319998780"
                className="footer-link transition hover:text-themePrimary"
                dir="ltr"
              >
                +92-331-9998780
              </a>
              <span dir="ltr">
                R-5, Row 5, Block D, NCECHS, Gulshan-e-iqbal Block 10A,
                Rashid Minhas Road, Karachi, Pakistan.
              </span>
            </div>
          </div>
        </div>

        <div className=" flex flex-col gap-2 border-t border-themeBorder pt-4 text-theme-kicker text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 مدرسہ سافٹ ویئر۔ تمام حقوق محفوظ ہیں۔</p>
          <p>Frontend + Backend ready management platform</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
