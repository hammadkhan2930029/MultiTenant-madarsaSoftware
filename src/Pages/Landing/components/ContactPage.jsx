import DemoRequestSection from './DemoRequestSection'

const contactCards = [
  {
    label: 'ای میل',
    value: 'info@madrasasoftware.com',
    helper: 'ڈیمو اور سپورٹ درخواست کے لیے',
    direction: 'ltr',
  },
  {
    label: 'فون',
    value: '+92-331-9998780',
    helper: 'سیلز ٹیم سے براہ راست رابطہ',
    direction: 'ltr',
  },
  {
    label: 'مقام',
    value: 'کراچی، پاکستان',
    helper: 'آن لائن ڈیمو دستیاب ہے',
  },
]

function ContactPage() {
  return (
    <>
      <section className="relative z-10 pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl px-4 py-10 text-right sm:px-6 lg:px-8">
          <div className="page-reveal max-w-3xl">
            <p className="text-theme-kicker font-bold text-themePrimary">رابطہ</p>
            <h1 className="mt-3 font-urdu text-theme-title font-bold text-themeText">
              مدرسہ سافٹ ویئر کے لیے ہم سے رابطہ کریں۔
            </h1>
            <p className="mt-4 max-w-2xl text-theme-body text-slate-600 dark:text-slate-300">
              اپنی مدرسہ یا ادارے کی تفصیلات بھیجیں۔ ہماری ٹیم آپ کو ڈیمو،
              قیمت اور سیٹ اپ کے بارے میں رہنمائی دے گی۔
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {contactCards.map((card, index) => (
              <article
                key={card.label}
                className="contact-info-card soft-panel rounded-xl border border-themeBorder bg-themeSurface/90 p-5 shadow-card-theme backdrop-blur"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <p className="text-theme-kicker font-black text-themePrimary">{card.label}</p>
                <h2
                  className="mt-3 break-words text-theme-body font-bold text-themeText"
                  dir={card.direction ?? 'rtl'}
                >
                  {card.value}
                </h2>
                <p className="mt-3 text-theme-kicker text-slate-500 dark:text-slate-400">
                  {card.helper}
                </p>
              </article>
            ))}
          </div>

          <div className="contact-info-card soft-panel mt-4 rounded-xl border border-themeBorder bg-themeSurface/90 p-5 text-right shadow-card-theme backdrop-blur">
            <p className="text-theme-kicker font-black text-themePrimary">دفتر کا پتہ</p>
            <h2
              className="mt-3 text-theme-body font-bold text-themeText"
              dir="ltr"
            >
              R-5, Row 5, Block D, NCECHS, Gulshan-e-iqbal Block 10A,
              Rashid Minhas Road, Karachi, Pakistan.
            </h2>
          </div>
        </div>
      </section>

      <DemoRequestSection />
    </>
  )
}

export default ContactPage
