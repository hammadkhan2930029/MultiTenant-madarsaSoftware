import { useState } from 'react'
import { useNotifier } from '../../../Components/Notifications/useNotifier'

const initialForm = {
  name: '',
  phone: '',
  email: '',
  madarsa: '',
}

function DemoRequestSection() {
  const notify = useNotifier()
  const [form, setForm] = useState(initialForm)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsSubmitted(true)
    notify.success('آپ کی ڈیمو درخواست کامیابی سے جمع ہو گئی ہے۔')
  }

  return (
    <section id="contact" className="relative z-10 min-h-screen py-16 sm:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="page-reveal mx-auto max-w-4xl text-center">
          <p className="text-theme-kicker font-bold text-themePrimary">ڈیمو درخواست</p>
          <h2 className="mt-3 font-urdu text-theme-title font-bold text-themeText">
            ڈیمو اکاؤنٹ حاصل کریں۔
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-theme-body text-slate-600 dark:text-slate-300">
            اپنی بنیادی معلومات بھیجیں۔ ہماری ٹیم آپ کو demo login اور password
            دے کر سسٹم کا مکمل walkthrough فراہم کرے گی۔
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="request-card soft-panel w-full rounded-xl border border-themeBorder bg-themeSurface/90 p-5 text-right shadow-theme backdrop-blur sm:p-6 lg:p-8"
        >
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-themeBorder pb-4">
            <div>
              <p className="text-theme-kicker font-bold text-themePrimary">
                Request Form
              </p>
              <h3 className="mt-1 font-urdu text-theme-title font-bold text-themeText">
                اپنی معلومات درج کریں
              </h3>
            </div>
            <span className="credential-lock">
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-theme-kicker font-bold text-themeText">
                آپ کا نام
              </span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-themeBorder bg-themeBg px-4 py-3 text-right text-theme-button text-themeText outline-none transition focus:border-themePrimary"
                placeholder="مثلاً محمد احمد"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-theme-kicker font-bold text-themeText">
                فون نمبر
              </span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-themeBorder bg-themeBg px-4 py-3 text-right text-theme-button text-themeText outline-none transition focus:border-themePrimary"
                dir="ltr"
                placeholder="+92-331-9998780"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-theme-kicker font-bold text-themeText">
                ای میل
              </span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-themeBorder bg-themeBg px-4 py-3 text-left text-theme-button text-themeText outline-none transition focus:border-themePrimary"
                dir="ltr"
                placeholder="info@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-theme-kicker font-bold text-themeText">
                مدرسہ / ادارہ کا نام
              </span>
              <input
                name="madarsa"
                value={form.madarsa}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-themeBorder bg-themeBg px-4 py-3 text-right text-theme-button text-themeText outline-none transition focus:border-themePrimary"
                placeholder="مثلاً جامعہ تعلیم القرآن"
              />
            </label>
          </div>

          <button
            type="submit"
            className="hero-action mt-5 w-full rounded-md bg-themePrimary px-5 py-3 text-theme-button font-bold text-white shadow-card-theme transition hover:bg-themePrimaryHover"
          >
            درخواست بھیجیں
          </button>

          {isSubmitted && (
            <div className="mt-5 rounded-lg border border-themePrimary/40 bg-themePrimary/10 p-4 text-theme-kicker font-bold text-themePrimary">
              آپ کی درخواست محفوظ ہو گئی ہے۔ ہماری ٹیم جلد رابطہ کرے گی۔
            </div>
          )}
        </form>
      </div>
    </section>
  )
}

export default DemoRequestSection
