export default function FortuneCookie({ fortune }) {
  return (
    <section className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-[#ffe48d]/30 bg-[#0a192d]/75 px-6 py-10 text-center shadow-[0_22px_54px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:px-10" aria-labelledby="fortune-cookie-heading">
      <div aria-hidden="true" className="absolute inset-x-1/4 top-0 h-24 rounded-full bg-[#f3c246]/15 blur-3xl" />
      <div className="relative flex flex-col items-center">
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="100" cy="100" r="96" fill="#f5f5f5" stroke="#d0d0d0" strokeWidth="4" />
          <ellipse cx="104" cy="132" rx="46" ry="10" fill="#d3c4aa" opacity="0.35" />
          <path d="M60 80 C50 100,52 125,75 140 C95 152,125 148,140 130 C155 112,152 90,140 75 C125 58,95 55,75 65 C68 68,63 73,60 80 Z" fill="#d9a15a" stroke="#b27835" strokeWidth="3" />
          <path d="M78 74 C92 68,112 70,126 82 C118 86,110 92,102 100 C94 108,86 116,78 122 C74 112,72 102,72 94 C72 86,74 79,78 74 Z" fill="#c48643" opacity="0.9" />
          <path d="M70 72 C82 64,104 62,122 72 C118 74,112 77,104 80 C96 83,86 86,78 88 C74 82,72 77,70 72 Z" fill="#e8c084" opacity="0.75" />
          <circle cx="88" cy="90" r="1.6" fill="#b4773a" opacity="0.7" /><circle cx="112" cy="96" r="1.4" fill="#b4773a" opacity="0.6" /><circle cx="98" cy="110" r="1.3" fill="#b4773a" opacity="0.6" /><circle cx="120" cy="116" r="1.5" fill="#b4773a" opacity="0.55" /><circle cx="80" cy="104" r="1.2" fill="#b4773a" opacity="0.6" />
          <path d="M118 78 L155 70 C160 69,165 72,167 77 L175 96 C177 101,174 106,169 107 L132 115 C127 116,122 113,120 108 L112 89 C110 84,113 79,118 78 Z" fill="#fff" stroke="#cfcfcf" strokeWidth="2" />
          <text x="147" y="92" fontSize="9" fontFamily="Arial, sans-serif" fill="#666" textAnchor="middle">Good fortune</text>
          <path d="M116 80 L132 76 L136 86 L120 90 Z" fill="#dcdcdc" opacity="0.8" />
        </svg>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Today’s Fortune</p>
        <h2 id="fortune-cookie-heading" className="mt-2 font-serif text-3xl text-[#ffd700]">A message for your day</h2>
        <p className="mt-5 min-h-12 max-w-md text-base leading-7 text-cyan-50 italic" aria-live="polite">
          {fortune ? `“${fortune}”` : 'Generate today’s luck to reveal your fortune.'}
        </p>
      </div>
    </section>
  );
}
