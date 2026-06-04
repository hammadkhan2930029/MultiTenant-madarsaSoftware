function SplashScreen() {
  return (
    <div
      className="splash-screen fixed inset-0 z-[999] grid place-items-center bg-themeBg text-themeText"
      role="status"
      aria-label="مدرسہ سافٹ ویئر لوڈ ہو رہا ہے"
    >
      <div className="splash-ambient pointer-events-none absolute inset-0" />
      <div className="splash-card relative z-10 flex flex-col items-center text-center">
        <div className="splash-logo grid size-20 place-items-center rounded-2xl bg-themePrimary text-theme-title font-black text-white shadow-theme">
          م
        </div>
        <h1 className="mt-5 font-urdu text-theme-title font-bold text-themeText">
          مدرسہ سافٹ ویئر
        </h1>
        <p className="mt-2 text-theme-kicker font-bold text-slate-500 dark:text-slate-300">
          مینجمنٹ سافٹ ویئر لوڈ ہو رہا ہے
        </p>
        <div className="splash-loader mt-7" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
