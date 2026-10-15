'use client';
import type { SVGProps } from 'react';

export default function CrystalBallArtwork(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 500 650" {...props} role="img" aria-label="A polished crystal ball with a ruby maple leaf, emerald clover, sapphire drop, and ornate gold pedestal" focusable="false">
    <title>Lucky Pick Canada Crystal Ball</title>
    <desc>A reflective blue-violet cosmic orb with a jeweled Canadian maple leaf, four-leaf clover, blue gemstone, and ornate gold-and-obsidian pedestal.</desc>
    <defs>
      <radialGradient id="crystalGlass" cx="35%" cy="27%" r="78%"><stop offset="0" stopColor="#4df7f0" stopOpacity=".5"/><stop offset=".25" stopColor="#173f71"/><stop offset=".62" stopColor="#07132e"/><stop offset=".86" stopColor="#040817"/><stop offset="1" stopColor="#111a35"/></radialGradient>
      <radialGradient id="nebulaViolet" cx="52%" cy="62%" r="58%"><stop offset="0" stopColor="#b44fff" stopOpacity=".75"/><stop offset=".4" stopColor="#285bff" stopOpacity=".36"/><stop offset="1" stopColor="#020718" stopOpacity="0"/></radialGradient>
      <radialGradient id="nebulaBlue" cx="70%" cy="34%" r="60%"><stop offset="0" stopColor="#2de9ff" stopOpacity=".75"/><stop offset=".38" stopColor="#326bff" stopOpacity=".26"/><stop offset="1" stopColor="#031025" stopOpacity="0"/></radialGradient>
      <linearGradient id="goldMetal" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stopColor="#fff4bd"/><stop offset=".16" stopColor="#e8a83c"/><stop offset=".29" stopColor="#fff2a0"/><stop offset=".48" stopColor="#8d4d12"/><stop offset=".67" stopColor="#ffdc73"/><stop offset=".84" stopColor="#9a5b17"/><stop offset="1" stopColor="#fff0a2"/></linearGradient>
      <linearGradient id="ruby" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stopColor="#ff858d"/><stop offset=".2" stopColor="#f31937"/><stop offset=".56" stopColor="#b90027"/><stop offset="1" stopColor="#5c001b"/></linearGradient>
      <linearGradient id="emerald" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bcff9a"/><stop offset=".22" stopColor="#21d774"/><stop offset=".58" stopColor="#007a40"/><stop offset="1" stopColor="#033a35"/></linearGradient>
      <linearGradient id="sapphire" x1=".1" y1="0" x2=".8" y2="1"><stop offset="0" stopColor="#d4ffff"/><stop offset=".25" stopColor="#56e6ff"/><stop offset=".58" stopColor="#176df5"/><stop offset="1" stopColor="#18245f"/></linearGradient>
      <linearGradient id="obsidian" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stopColor="#344057"/><stop offset=".18" stopColor="#070b15"/><stop offset=".46" stopColor="#1c2534"/><stop offset=".7" stopColor="#03050c"/><stop offset="1" stopColor="#272c39"/></linearGradient>
      <radialGradient id="orbRim" cx="28%" cy="20%" r="90%"><stop offset="0" stopColor="#fff7d7"/><stop offset=".13" stopColor="#d5eaff"/><stop offset=".28" stopColor="#bbfaff"/><stop offset=".47" stopColor="#16263d"/><stop offset=".68" stopColor="#050813"/><stop offset=".85" stopColor="#d2a24a"/><stop offset="1" stopColor="#fff0b2"/></radialGradient>
      <filter id="jewelGlow" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="softGlow" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="10"/></filter>
      <clipPath id="orbClip"><circle cx="250" cy="224" r="163"/></clipPath>
    </defs>
    <ellipse cx="250" cy="230" rx="199" ry="206" fill="#2c5dff" opacity=".16" filter="url(#softGlow)"/>
    <circle cx="250" cy="224" r="184" fill="#02040b" stroke="#04060b" strokeWidth="9"/>
    <circle cx="250" cy="224" r="177" fill="url(#orbRim)" stroke="#a7d2eb" strokeOpacity=".46" strokeWidth="2"/>
    <circle cx="250" cy="224" r="168" fill="url(#crystalGlass)" stroke="#d8f5ff" strokeOpacity=".72" strokeWidth="2.5"/>
    <g clipPath="url(#orbClip)">
      <rect x="84" y="58" width="332" height="332" fill="url(#nebulaViolet)"/><rect x="84" y="58" width="332" height="332" fill="url(#nebulaBlue)"/>
      <ellipse cx="242" cy="269" rx="152" ry="46" fill="none" stroke="#9365ff" strokeWidth="2" opacity=".42" transform="rotate(-19 242 269)"/>
      <ellipse cx="250" cy="252" rx="143" ry="57" fill="none" stroke="#39dfff" strokeWidth="2" opacity=".5" transform="rotate(24 250 252)"/>
      <ellipse cx="257" cy="240" rx="126" ry="81" fill="none" stroke="#a881ff" strokeWidth="1.4" opacity=".42" transform="rotate(-34 257 240)"/>
      <path d="M112 262 C154 186 194 326 233 237 S320 142 389 205" fill="none" stroke="#24d9ff" strokeWidth="4" opacity=".72" filter="url(#jewelGlow)"/>
      <path d="M118 206 C173 280 204 139 248 217 S323 315 382 245" fill="none" stroke="#9c73ff" strokeWidth="3" opacity=".68"/>
      <path d="M148 124 C196 180 157 218 212 265 S278 306 319 343 M339 108 C286 159 342 205 289 245 S252 296 260 350" fill="none" stroke="#3af6e5" strokeWidth="2.3" opacity=".48"/>
      <g fill="#fff6cb"><circle cx="144" cy="168" r="2.2"/><circle cx="176" cy="118" r="1.4"/><circle cx="211" cy="96" r="1.8"/><circle cx="310" cy="103" r="2.1"/><circle cx="354" cy="151" r="1.5"/><circle cx="372" cy="224" r="2.4"/><circle cx="333" cy="308" r="1.7"/><circle cx="289" cy="357" r="1.5"/><circle cx="181" cy="327" r="2"/><circle cx="125" cy="277" r="1.4"/><circle cx="198" cy="286" r="1.2"/><circle cx="321" cy="187" r="1.1"/><circle cx="276" cy="130" r="1.1"/><circle cx="231" cy="333" r="1.3"/></g>
      <path d="M250 119 L268 154 L302 137 L294 170 L329 169 L307 195 L329 213 L292 217 L286 249 L250 229 L214 249 L208 217 L171 213 L193 195 L171 169 L206 170 L198 137 L232 154 Z" fill="url(#ruby)" stroke="url(#goldMetal)" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M250 119 L250 229 L214 249 L226 203 L193 195 L232 184 L206 170 L246 172 Z" fill="#ff6a80" opacity=".48"/>
      <path d="M250 119 L268 154 L250 172 Z M268 154 L302 137 L281 174 L250 172 Z M302 137 L294 170 L281 174 Z M329 169 L307 195 L281 174 Z M329 213 L292 217 L281 199 Z M286 249 L250 229 L270 205 Z" fill="#ffbdc1" opacity=".35"/>
      <path d="M250 119 L250 229 M206 170 L250 172 L294 170 M193 195 L250 190 L307 195 M214 249 L250 229 L286 249" fill="none" stroke="#ffdca0" strokeOpacity=".6" strokeWidth="1.1"/>
      <g stroke="url(#goldMetal)" strokeWidth="3.5"><ellipse cx="233" cy="190" rx="21" ry="25" fill="url(#emerald)" transform="rotate(-38 233 190)"/><ellipse cx="267" cy="190" rx="21" ry="25" fill="url(#emerald)" transform="rotate(38 267 190)"/><ellipse cx="233" cy="218" rx="21" ry="25" fill="url(#emerald)" transform="rotate(38 233 218)"/><ellipse cx="267" cy="218" rx="21" ry="25" fill="url(#emerald)" transform="rotate(-38 267 218)"/></g>
      <path d="M250 201 L234 186 L238 204 L250 211 L262 186 L258 204 Z M250 211 L233 223 L244 221 L250 211 L256 221 L267 223 Z" fill="#b9ffbd" opacity=".65"/>
      <circle cx="250" cy="205" r="5.5" fill="url(#goldMetal)" stroke="#fff4bb" strokeWidth="1.4"/>
      <path d="M236 232 L264 232 L260 253 L250 271 L240 253 Z" fill="#f7bd56" stroke="#fff0a1" strokeWidth="2.5"/>
      <path d="M238 234 L262 234 L258 253 L250 266 L242 253 Z" fill="url(#sapphire)" stroke="#8ffaff" strokeWidth="1.2"/>
      <path d="M250 235 L250 265 M239 242 L261 242 M242 253 L258 253" stroke="#d6ffff" strokeOpacity=".65" strokeWidth="1.2"/>
      <path d="M129 178 C143 120 181 82 218 75" fill="none" stroke="#fff" strokeOpacity=".78" strokeWidth="9" strokeLinecap="round"/>
      <path d="M136 184 C148 136 173 116 197 105" fill="none" stroke="#b5faff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round"/>
      <path d="M299 77 C334 91 359 120 372 148" fill="none" stroke="#fff4d1" strokeOpacity=".62" strokeWidth="5" strokeLinecap="round"/>
    </g>
    <path d="M104 341 C128 362 144 377 155 411 L190 448 L164 463 L116 414 C103 393 91 371 88 350 Z M396 341 C372 362 356 377 345 411 L310 448 L336 463 L384 414 C397 393 409 371 412 350 Z" fill="url(#goldMetal)" stroke="#4c2a0a" strokeWidth="4"/>
    <path d="M105 360 C126 376 133 395 147 416 M395 360 C374 376 367 395 353 416" fill="none" stroke="#fff0a1" strokeWidth="3"/>
    <path d="M113 389 C131 385 137 402 123 412 C109 422 115 437 132 430 M387 389 C369 385 363 402 377 412 C391 422 385 437 368 430" fill="none" stroke="#fff0a1" strokeWidth="3" strokeLinecap="round"/>
    <path d="M148 400 L352 400 L377 465 L365 514 L135 514 L123 465 Z" fill="url(#obsidian)" stroke="url(#goldMetal)" strokeWidth="5"/>
    <path d="M143 421 Q250 445 357 421 M133 462 Q250 481 367 462 M137 501 Q250 516 363 501" fill="none" stroke="#e2ae4e" strokeWidth="3"/>
    <path d="M143 409 Q250 430 350 409 M161 432 L179 454 L161 476 M339 432 L321 454 L339 476" fill="none" stroke="#fff1b0" strokeOpacity=".75" strokeWidth="2"/>
    <path d="M175 446 C188 427 202 439 190 453 C180 464 195 471 205 459 M325 446 C312 427 298 439 310 453 C320 464 305 471 295 459" fill="none" stroke="#e6b14c" strokeWidth="3" strokeLinecap="round"/>
    <rect x="145" y="464" width="210" height="39" rx="5" fill="#070910" stroke="url(#goldMetal)" strokeWidth="3"/><rect x="151" y="469" width="198" height="29" rx="3" fill="none" stroke="#926421" strokeWidth="1"/>
    <path d="M145 481 H132 L142 491 M355 481 H368 L358 491 M240 513 L250 502 L260 513 L250 527 Z" fill="none" stroke="url(#goldMetal)" strokeWidth="2.5"/>
    <path d="M75 531 Q250 552 425 531 L451 588 Q250 619 49 588 Z" fill="url(#obsidian)" stroke="url(#goldMetal)" strokeWidth="5"/>
    <path d="M54 567 Q250 594 446 567 M61 581 Q250 607 439 581" fill="none" stroke="#d7a13f" strokeWidth="2.5"/>
    <path d="M138 551 C158 536 173 560 151 563 C140 564 141 572 154 572 M362 551 C342 536 327 560 349 563 C360 564 359 572 346 572 M250 539 L257 550 L250 561 L243 550 Z" fill="none" stroke="#f6ce69" strokeWidth="2.4" strokeLinecap="round"/>
    <path d="M52 590 Q250 615 448 590 L465 610 Q250 640 35 610 Z" fill="url(#obsidian)" stroke="url(#goldMetal)" strokeWidth="4"/>
    <path d="M39 610 Q250 638 461 610" fill="none" stroke="#fff0a1" strokeOpacity=".7" strokeWidth="2"/>
    <ellipse cx="250" cy="626" rx="150" ry="5" fill="#e8b451" opacity=".2" filter="url(#softGlow)"/>
  </svg>;
}
