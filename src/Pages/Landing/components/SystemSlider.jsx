import { useState } from 'react'
import slideFour from '../assets/four.png'
import slideOne from '../assets/one.png'
import slideThree from '../assets/three.png'
import slideTwo from '../assets/two.png'
import { slides } from '../data/landingData'

const slideImages = [slideOne, slideTwo, slideThree, slideFour]

function SystemSlider() {
  const [activeSlide, setActiveSlide] = useState(0)
  const slide = slides[activeSlide]

  return (
    <section id="slider" className="relative z-10 border-y border-themeBorder bg-transparent">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:items-center lg:px-8 lg:[direction:ltr]">
        <div className="slider-panel soft-panel rounded-xl border border-themeBorder bg-themeBg p-4 shadow-card-theme [direction:rtl]">
          <div className="slider-image-card overflow-hidden rounded-lg border border-themeBorder bg-themeSurface shadow-card-theme">
            <img
              src={slideImages[activeSlide]}
              alt={`${slide.label} module preview`}
              className="slider-image block w-full"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {slides.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`slider-tab rounded-md border px-3 py-3 text-theme-button font-bold transition ${
                  activeSlide === index
                    ? 'border-themePrimary bg-themePrimary text-white'
                    : 'border-themeBorder bg-themeSurface text-themeText hover:border-themePrimary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="page-reveal text-right [direction:rtl]">
          <p className="text-theme-kicker font-bold text-themePrimary">سسٹم سلائیڈر</p>
          <h2 className="mt-3 font-urdu text-theme-title font-bold text-themeText">
            {slide.label} ماڈیول صاف اور منظم انداز میں۔
          </h2>
          <div className="slider-card mt-5 rounded-lg border border-themeBorder bg-themeSurface p-6 text-right shadow-card-theme">
            <span className="rounded-md bg-themePrimary/10 px-3 py-1 text-theme-kicker font-bold text-themePrimary">
              {slide.label}
            </span>
            <h3 className="mt-5 max-w-2xl font-urdu text-theme-body font-bold text-themeText">
              {slide.title}
            </h3>
            <div className="mt-8 flex items-end gap-4">
              <p className="text-theme-title font-black text-themePrimary">
                {slide.stat}
              </p>
              <p className="pb-2 text-theme-detail font-bold text-slate-500 dark:text-slate-400">
                {slide.statLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SystemSlider
