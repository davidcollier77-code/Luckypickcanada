// NOTE: The edge runtime is explicitly avoided in this route to allow OpenNext bundling to compile correctly.
import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { checkApiRateLimit, getClientIp } from '../../spam-protection';

const ALLOWED_ORIGINS = [
  'https://luckypickcanada.ca',
  'https://www.luckypickcanada.ca',
  // DevSkim: ignore DS162092
  'http://localhost:3000',
];

function getCorsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

const SHARED_ORACLE_VOICE = [
  'You are the Lucky Pick Canada Crystal Ball: clever, mysterious, witty, warm, uplifting and unmistakably Canadian — not a generic AI assistant.',
  'Canadian humour belongs here naturally: weather, hockey, maple syrup, coffee, familiar expressions, friendly sarcasm and the occasional well-placed "eh?". Never force every reference into one reading.',
  'Use the supplied calendar facts exactly. Never invent or recalculate a weekday, date, season or holiday. If you mention an upcoming occasion or a promising day, use only the supplied weekday and occasion information and keep it accurate.',
  'Vary the style across mysterious, funny, romantic, encouraging, thoughtful and surprising. Avoid repetitive fortune-cookie lines, empty platitudes, robotic help-desk phrasing and the same opening every time.',
  'This is entertainment only. Never claim supernatural powers or certainty, never invent private facts, never promise a lottery win or jackpot, never claim to know winning numbers, and never encourage spending more or chasing losses.',
].join(' ');

const FORTUNE_SYSTEM_PROMPT = [
  SHARED_ORACLE_VOICE,
  'Write today’s fortune without asking the visitor a question. Most fortunes should be two to four well-written sentences: begin with something specific and rewarding, then add meaning, atmosphere or a memorable Canadian detail.',
  'Recognize the current Canadian season and any supplied holiday naturally when it fits; do not force a holiday into an unrelated fortune. Occasionally suggest a promising weekday or upcoming date, but only using the supplied calendar facts.',
  'Use the supplied visitor local time only to set the atmosphere (morning, afternoon, evening or late night); never state or invent a different time.',
].join(' ');

const FOLLOW_UP_SYSTEM_PROMPT = [
  SHARED_ORACLE_VOICE,
  'The visitor has already received a daily fortune and may ask exactly one follow-up question related to it. First understand what the visitor actually asked, then answer that specific question immediately with a clear, vivid reading. Do not dodge into generic advice, a list of possibilities, or a request to ask something else.',
  'When the visitor asks for one lucky day, number, colour, direction, symbol or choice, choose ONE specific answer and interpret it. Name one actual day of the week selected for this reading instead of saying any day could be lucky. Make a fresh choice grounded in the question and vary readings; never default to Friday or another stock answer just because it is common. Never suggest that a lucky choice changes actual lottery odds.',
  'Connect the answer to the supplied original fortune, but do not repeat the whole fortune. Keep it concise, usually 1–3 sentences. Make the first sentence specific and rewarding; use any following sentence to add meaning, atmosphere or a memorable detail.',
  'For factual or practical questions, answer clearly and accurately first. If asked whether the visitor will win a lottery, give a distinctive, playful fortune-style reading without pretending to know the outcome: never promise a win or jackpot, guarantee a result, or claim access to future winning numbers.',
].join(' ');

const GENERAL_FALLBACK_FORTUNES = [
  'The mists show a small, excellent turn in your favour today. Someone notices the effort you thought went unnoticed, and a quiet laugh arrives exactly when you need it.',
  'A steady stride beats a dramatic sprint this afternoon, even if the coffee is doing most of the planning. Keep your stick on the ice and let the good part arrive on time.',
  'There is a lucky little detour waiting for you, probably where you least expect it. Follow the warmer welcome, not the loudest sign, and the day will reward the choice.',
  'Your patience is quietly earning interest, like a good batch of maple syrup. The sweet part is closer than the calendar suggests, so do not rush the boil.',
  'A friendly conversation opens a door you did not know was unlocked. Say yes to the second cup and let the rest of the afternoon surprise you, eh?',
  'The Northern Lights are doing their best impression of a pep talk. Something you have been carrying lightly turns out to matter more than you thought; keep going.',
  'A tiny Canadian practicality saves the day: check the pockets, check the weather, and trust the plan you already made. Good fortune prefers a prepared pair of mittens.',
  'Someone is about to appreciate your dry sense of humour more than they let on. The day brings a warm exchange, a useful idea and a reason to take the scenic route home.',
  'The glass clears around a choice you have been circling. You do not need a grand sign; the quieter option is the one that leaves you more room to breathe.',
  'A pleasant surprise arrives wearing ordinary clothes: a message, a small win, a parking spot that feels suspiciously generous. Accept it without asking the universe to explain itself.',
  'Your week is about to get a little more interesting, in the way a good hockey game gets interesting in the third period. Stay in the play; the momentum is already shifting.',
  'The mists recommend a generous helping of common sense and a completely unreasonable amount of optimism. Together they make a surprisingly good team today.',
  'A door that felt closed is not locked, just stiff. Give it one more honest try before you decide the story is over; the hinges are kinder than they look.',
  'A warm drink, a clear head and one honest conversation will untangle more than a whole afternoon of worrying. The universe has left you a simple shortcut.',
  'You are due for one of those small, ridiculous coincidences that make a Canadian day feel charmed. Notice it, enjoy it, and do not overthink the paperwork.',
  'A good idea is circling your attention like a snow squall that cannot decide where to land. Write it down before it blows past; it is worth a second look.',
  'The mists see a sensible plan and a mischievous little opportunity heading toward each other. Let them meet halfway, and the result will be better than either alone.',
  'Someone will offer help before you have to ask, which is both lovely and slightly suspicious. Take it, say thanks, and return the favour when the kettle is on.',
  'Your luck today is less fireworks and more porch light: steady, warm and exactly enough to get you home. Trust the quiet kind of good news.',
  'A familiar expression lands perfectly today: keep your stick on the ice. Do the next useful thing, and the bigger picture will take care of its own dramatic entrance.',
];

const SEASONAL_FALLBACK_FORTUNES = {
  winter: [
    'Winter is doing its full dramatic performance today, so dress like you mean it and let the cold sharpen your good ideas. A warm welcome is waiting closer than the forecast suggests.',
    'The snow makes everything quieter, which is exactly the space you need for a clever thought. Give yourself ten unhurried minutes and the answer will arrive wearing a toque.',
    'A bright, cold morning is hiding a warm little surprise. Keep your mittens handy, your expectations flexible and your sense of humour fully charged.',
    'The season of early sunsets is also the season of excellent excuses to stay in and get things done. One small task finishes easily today, and it changes the whole mood.',
    'Winter luck arrives like a perfectly timed snow day: quietly, then all at once. Make room for an unexpected pause and see what it makes possible.',
    'The frost is drawing patterns on the window and a good idea on the edge of your attention. Stay warm, stay curious and let the day unfold at a human pace.',
  ],
  spring: [
    'Spring is practising its comeback, and so are you. A fresh start that felt too late is simply waiting for the next warm afternoon; begin with one small, hopeful thing.',
    'The melt is revealing new ground, and a stalled plan is revealing a better route. Give it a little sunlight and do not be surprised when it grows faster than expected.',
    'A muddy-boots kind of day brings a clean, useful idea. Say yes to the walk, the chat or the second attempt; the season is on your side.',
    'Maple sap is rising and so is your momentum. Something you planted in patience is finally showing green; keep watering it without checking the clock every five minutes.',
    'Spring weather cannot make up its mind, and neither can an opportunity that keeps circling back. Choose the version that feels lighter, and the rest will settle.',
    'A cheerful little coincidence arrives with the warmer air. Let yourself be delighted for a moment; delight is a perfectly sensible strategy today.',
  ],
  summer: [
    'Summer is stretching out like a long weekend, and your best move is to leave a little room in the schedule. The unplanned part of the day carries the good news.',
    'The sun is doing its enthusiastic thing, so pace yourself like a sensible Canadian at a backyard barbecue. A cold drink, a shady chair and one good conversation will reset the whole week.',
    'A bright afternoon brings a bright idea, though it may arrive while you are doing something completely unrelated. Keep a pen nearby and let the thought finish.',
    'The season of open windows and late light is nudging you toward a generous little risk. Try the thing that makes the day feel wider; you do not need to overthink it.',
    'A familiar summer sound — a screen door, a distant lawn mower, a lake at dusk — carries a small piece of good news. Notice the ordinary magic and let it count.',
    'Your luck is running warm today, like a dock in the afternoon sun. Take the invitation, make the plan and leave enough time to enjoy the walk back.',
  ],
  autumn: [
    'Autumn is handing out golden light and a reason to slow down. The thing you have been rushing may only need one more thoughtful look before it makes sense.',
    'A crisp morning brings a clear answer, even if it arrives after the second coffee. Bundle up, take the longer route and let the fresh air do its quiet work.',
    'The leaves are changing and so is a plan you thought was settled. This shift is friendly; it is making room for something you actually want.',
    'Harvest season suits you today: gather the small wins, thank the people who helped and do not leave the good parts uneaten. There is more abundance here than the list suggests.',
    'A cozy, practical kind of luck follows you today. Fix the small annoyance, make the warm drink and watch how much lighter the afternoon becomes.',
    'The season of scarves and second thoughts is asking you to choose the warmer option. In people, in plans and in the last slice of pie, warmth is the right measure.',
  ],
};

const HOLIDAY_FALLBACK_FORTUNES = {
  "New Year's Day": [
    'A brand-new calendar is a lovely thing, but you do not need a dramatic resolution today. Choose one small habit that makes tomorrow easier, and let the rest of the year catch up.',
    'The first day of the year is mostly a promise with better lighting. Make one gentle plan, leave room for a nap and trust that the year will have opinions of its own.',
    'A fresh start arrives with sensible footwear and a slightly unrealistic list. Keep the list short, keep the coffee strong and let the first good surprise find you.',
    'The mists see a year with more room in it than last year’s version. Begin with something you can actually finish today, and let momentum handle the rest.',
  ],
  "Valentine's Day": [
    'Valentine’s Day does not require a grand gesture; the mists are more impressed by a genuinely kind one. Send the message, share the chocolate and let warmth be the whole strategy.',
    'A small, thoughtful act lands like a warm cinnamon bun today. Whether the day is romantic, friendly or happily solo, make room for the people who make you laugh.',
    'The glass shows a heart that knows the difference between a performance and a kindness. Choose the sincere version, even if it is a little awkward, and it will be remembered.',
    'Love, in all its forms, is doing a quiet Canadian thing today: showing up with coffee and not making a fuss. Notice who does that for you and return the favour.',
  ],
  'Easter Sunday': [
    'Easter brings a gentle reset and a suspicious amount of chocolate. Let something small be reborn today: a habit, a hope or a conversation you thought was finished.',
    'The mists see a fresh beginning hiding among the spring colours. You do not have to understand the whole story yet; just take the next hopeful step.',
    'A warm gathering or a quiet morning offers the same useful message today: there is more room for renewal than you think. Be kind to the version of you that is still learning.',
    'Something you set aside is ready for a second chance, like a spring bulb that did not read the calendar. Give it light, patience and a little less pressure.',
  ],
  'Good Friday': [
    'A quiet day suits a quiet answer. Step back from the noise, make space for one honest thought and let the rest of the weekend arrive without a performance.',
    'The mists recommend a slower pace and a kinder inner voice today. Not every question needs solving before supper; some just need room to breathe.',
    'A pause is not a setback. Today’s good fortune is the clarity that arrives when you stop carrying everyone else’s urgency for an hour.',
    'There is a gentle sort of luck in keeping things simple today. A warm meal, a familiar face and one unfinished worry left on the shelf will do nicely.',
  ],
  'Victoria Day': [
    'The long weekend has officially arrived, and so has your permission to do less. Make a plan with room for a patio chair, a friend and absolutely no unnecessary rushing.',
    'Victoria Day brings the first real taste of summer and a suspiciously optimistic forecast. Pack the layers, bring the snacks and let the afternoon wander where it likes.',
    'A holiday Monday is a fine time to remember that good luck often looks like unscheduled time. Spend a little of it on something that makes you laugh.',
    'The mists see fireworks, or at least a very good backyard conversation. Either way, the evening is on your side; leave the phone inside for a while.',
  ],
  'Canada Day': [
    'Canada Day suits you: a little proud, a little playful and happiest when everyone has a place at the table. Celebrate something small and true today, eh?',
    'The mists see red and white, a warm breeze and a plan that gets better the longer you stay outside. Bring the sunscreen and your best terrible joke.',
    'A country-sized celebration is lovely, but your good fortune today is personal: a shared laugh, a familiar song and the feeling of belonging somewhere.',
    'Fireworks are fine, but the real spark today is a conversation that reminds you how much room there is for kindness in this big, weather-confused country.',
  ],
  'Labour Day': [
    'The last long weekend of summer has arrived, and your good fortune is a slow morning with nowhere urgent to be. Make the most of the extra day, eh?',
    'Labour Day is a fine time to notice how much you have carried this season. Put down one unnecessary task and let the afternoon be pleasantly unproductive.',
  ],
  'National Day for Truth and Reconciliation': [
    'Today asks for reflection as much as rest. Honour the history carried by others, listen with care and carry that understanding into something ordinary and good.',
    'The mists are quiet today. Make room to learn, to listen and to remember that reconciliation is built in small, sincere choices.',
  ],
  Thanksgiving: [
    'Thanksgiving asks for gratitude, and the mists are pleased to report there is more of it within reach than the busy week suggests. Name three ordinary good things and watch the day soften.',
    'A harvest-sized plate and a generous second helping of patience are the right portions today. Someone at the table has a story worth hearing; make room for it.',
    'The season of gathering reminds you that support often arrives in casseroles and inconveniently timed phone calls. Accept both; they count.',
    'Your good fortune today is the kind you can pass around. Share the credit, save the last piece for someone else and notice how much lighter the whole table feels.',
  ],
  Halloween: [
    'Halloween is the one night when a little mystery is practically a public service. Dress up, play along and let the spooky part stay firmly on the entertainment side of the street.',
    'The mists are wearing their dramatic cape today. Expect a pleasant fright, a clever costume and a sugar rush that makes the whole evening feel slightly enchanted.',
    'A playful disguise suits you better than a serious plan tonight. Knock on the door, take the candy and leave the overthinking at home with the porch light on.',
    'Something delightfully odd crosses your path today. Enjoy the theatrics, keep your sense of humour handy and remember that real magic is mostly good timing and good company.',
  ],
  'Remembrance Day': [
    'Today asks for a quieter kind of attention. Take a moment to remember, then carry that care into something ordinary and good: a call, a kindness, a little more patience.',
    'The mists are still today. Gratitude, remembrance and a gentle pace belong together; let the rest of the world hurry on without you for a few minutes.',
    'A small act of respect can change the temperature of an entire day. Pause, remember and let the peace you make room for travel further than you expect.',
    'There is strength in remembering without turning the day into a performance. Keep it sincere, keep it warm and be kind to the people carrying older stories.',
  ],
  'Christmas Day': [
    'Christmas arrives with its familiar magic: a warm kitchen, a little chaos and at least one gift that gets a genuine laugh. Let the imperfect version be the one you enjoy.',
    'The mists see a day made of small kindnesses rather than perfect plans. Share the last cookie, call someone who would love to hear your voice and let the rest be enough.',
    'A cozy, candlelit sort of luck follows you today. The best moment may be unplanned, unpaid and slightly off-key; that is usually how the good ones arrive.',
    'There is more warmth in the room than the wrapping paper suggests. Notice who made it happen, thank them properly and save a little quiet for yourself.',
  ],
};

const FOLLOW_UP_FALLBACKS = [
  'The mists keep the sharper details close, but they do lean toward a warmer answer than you expected. Give it a day and watch for the second sign.',
  'The glass shows a small, practical step rather than a grand leap. Take the one that leaves you more room to breathe, eh?',
  'A familiar Canadian answer applies here: check the forecast, dress in layers and do not let one cold patch decide the whole season.',
  'The mists see the question turning over like a coin, and the side that lands facing up is the one you already suspect. Trust the quieter instinct.',
  'There is a promising little opening here, though it arrives with ordinary timing rather than fireworks. Say yes to the next useful conversation.',
  'The fortune is not finished with you yet. Keep your stick on the ice; the play is still developing, and the next pass is friendlier than it looks.',
];

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const HOLIDAY_NAMES = {
  newYears: "New Year's Day",
  valentines: "Valentine's Day",
  easter: 'Easter Sunday',
  goodFriday: 'Good Friday',
  victoria: 'Victoria Day',
  canada: 'Canada Day',
  labour: 'Labour Day',
  truthReconciliation: 'National Day for Truth and Reconciliation',
  thanksgiving: 'Thanksgiving',
  halloween: 'Halloween',
  remembrance: 'Remembrance Day',
  christmas: 'Christmas Day',
};

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toDateKey(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day, key: value };
}

function getServerDateKey() {
  const now = new Date();
  return toDateKey(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
}

function addDays(year, month, day, delta) {
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function nthWeekdayOfMonth(year, month, weekday, nth) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay();
  return 1 + ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7;
}

// Victoria Day is the Monday preceding May 25 (not May 25 itself when that is a Monday).
function victoriaDay(year) {
  const may25 = new Date(Date.UTC(year, 4, 25));
  const daysSinceMonday = (may25.getUTCDay() + 6) % 7;
  const offset = daysSinceMonday === 0 ? 7 : daysSinceMonday;
  return 25 - offset;
}

function getHolidayDates(year) {
  const easter = easterSunday(year);
  const goodFriday = addDays(year, easter.month, easter.day, -2);
  const thanksgiving = nthWeekdayOfMonth(year, 10, 1, 2);

  return [
    { name: HOLIDAY_NAMES.newYears, key: toDateKey(year, 1, 1) },
    { name: HOLIDAY_NAMES.valentines, key: toDateKey(year, 2, 14) },
    { name: HOLIDAY_NAMES.goodFriday, key: toDateKey(goodFriday.year, goodFriday.month, goodFriday.day) },
    { name: HOLIDAY_NAMES.easter, key: toDateKey(year, easter.month, easter.day) },
    { name: HOLIDAY_NAMES.victoria, key: toDateKey(year, 5, victoriaDay(year)) },
    { name: HOLIDAY_NAMES.canada, key: toDateKey(year, 7, 1) },
    { name: HOLIDAY_NAMES.labour, key: toDateKey(year, 9, nthWeekdayOfMonth(year, 9, 1, 1)) },
    { name: HOLIDAY_NAMES.truthReconciliation, key: toDateKey(year, 9, 30) },
    { name: HOLIDAY_NAMES.thanksgiving, key: toDateKey(year, 10, thanksgiving) },
    { name: HOLIDAY_NAMES.halloween, key: toDateKey(year, 10, 31) },
    { name: HOLIDAY_NAMES.remembrance, key: toDateKey(year, 11, 11) },
    { name: HOLIDAY_NAMES.christmas, key: toDateKey(year, 12, 25) },
  ];
}

function getSeason(month, day) {
  if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day <= 20)) {
    return 'spring';
  }
  if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day <= 21)) {
    return 'summer';
  }
  if ((month === 9 && day >= 22) || month === 10 || month === 11 || (month === 12 && day <= 20)) {
    return 'autumn';
  }
  return 'winter';
}

function formatHolidayDate(key) {
  const parsed = parseCalendarDate(key);
  if (!parsed) return key;
  return `${MONTH_NAMES[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
}

function getCalendarContext(localDateKey) {
  const parsed = parseCalendarDate(localDateKey) || parseCalendarDate(getServerDateKey());
  const weekdayIndex = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day),
  ).getUTCDay();
  const todayMs = Date.UTC(parsed.year, parsed.month - 1, parsed.day);

  const candidates = [
    ...getHolidayDates(parsed.year),
    ...getHolidayDates(parsed.year + 1),
  ]
    .map((holiday) => {
      const holidayDate = parseCalendarDate(holiday.key);
      const holidayMs = Date.UTC(
        holidayDate.year,
        holidayDate.month - 1,
        holidayDate.day,
      );
      return {
        ...holiday,
        daysUntil: Math.round((holidayMs - todayMs) / 86400000),
      };
    })
    .filter((holiday) => holiday.daysUntil >= 0 && holiday.daysUntil <= 45)
    .sort((left, right) => left.daysUntil - right.daysUntil);

  return {
    localDate: parsed.key,
    day: parsed.day,
    monthName: MONTH_NAMES[parsed.month - 1],
    year: parsed.year,
    weekday: WEEKDAY_NAMES[weekdayIndex],
    season: getSeason(parsed.month, parsed.day),
    holiday: candidates.find((holiday) => holiday.daysUntil === 0) || null,
    upcoming: candidates.filter((holiday) => holiday.daysUntil > 0),
  };
}

function describeCalendar(context, timeZone, localTime) {
  const dateLabel = `${context.weekday}, ${context.monthName} ${context.day}, ${context.year}`;
  const upcoming = context.upcoming.length
    ? context.upcoming
        .map(
          (holiday) =>
            `${holiday.name} on ${formatHolidayDate(holiday.key)} (${holiday.daysUntil} ${
              holiday.daysUntil === 1 ? 'day' : 'days'
            } away)`,
        )
        .join('; ')
    : 'none in the next 45 days';

  return [
    'Calendar facts for the visitor’s local day (use these exactly; do not recalculate them):',
    `today is ${dateLabel}.`,
    `Season: ${context.season}.`,
    `Canadian holiday today: ${context.holiday ? context.holiday.name : 'none'}.`,
    `Upcoming Canadian occasions: ${upcoming}.`,
    timeZone ? `Visitor time zone: ${timeZone}.` : '',
    localTime ? `Visitor local time: ${localTime}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function getRandomItem(items) {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  return items[randomBuffer[0] % items.length];
}

function getRandomFallback(context) {
  const seasonal = context?.season
    ? SEASONAL_FALLBACK_FORTUNES[context.season] || []
    : [];
  const holiday = context?.holiday
    ? HOLIDAY_FALLBACK_FORTUNES[context.holiday.name] || []
    : [];
  const pool = holiday.length
    ? [...holiday, ...holiday, ...seasonal]
    : [...seasonal, ...seasonal, ...GENERAL_FALLBACK_FORTUNES];

  return getRandomItem(pool.length ? pool : GENERAL_FALLBACK_FORTUNES);
}

function getRandomFollowUpFallback() {
  return getRandomItem(FOLLOW_UP_FALLBACKS);
}

function fallbackPayload(context, mode) {
  const reading =
    mode === 'follow-up' ? getRandomFollowUpFallback() : getRandomFallback(context);
  return { prediction: reading, fortune: reading, reading, source: 'fallback' };
}

function getApiKey() {
  let apiKey = process.env.GROQ_API_KEY;
  try {
    const ctx = getCloudflareContext();
    if (ctx?.env?.GROQ_API_KEY) apiKey = ctx.env.GROQ_API_KEY;
  } catch {
    // Running outside Cloudflare; keep the process environment fallback.
  }
  return apiKey;
}

const INJECTION_PATTERNS = [
  'ignore previous',
  'ignore all',
  'disregard',
  'system:',
  'assistant:',
  'prompt:',
  'instructions:',
];

function containsPromptInjection(value) {
  const lowercased = value.toLowerCase();
  return INJECTION_PATTERNS.some((pattern) => lowercased.includes(pattern));
}

function sanitizeText(value) {
  return value
    .replace(/["'\\]/g, '')
    .replaceAll(String.fromCharCode(96), '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[<>]/g, '')
    .trim();
}

function sanitizeTimeZone(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, 64);
  return /^[A-Za-z0-9_+\-/]+$/.test(trimmed) ? trimmed : null;
}

/**
 * Accept only a 24-hour wall-clock time sent by the visitor's browser. The
 * calendar facts (date, weekday, season, holidays) always come from the
 * already-validated local date, so a malformed or spoofed time can only change
 * the reading's atmosphere, never a factual calendar claim.
 */
function sanitizeLocalTime(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed) ? trimmed : null;
}

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  const clientIp = getClientIp(request) || 'anonymous';
  let requestMode = 'fortune';
  let calendarContext = null;

  try {
    // Keep the short-window abuse limit, independent of the visitor-side daily counter.
    const rateLimit = await checkApiRateLimit(clientIp, 'oracle', 10, 60000);
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before consulting the oracle again.' },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid question format.' }, { status: 400, headers: corsHeaders });
    }

    if (body.mode !== undefined && body.mode !== 'fortune' && body.mode !== 'follow-up') {
      return NextResponse.json({ error: 'Invalid request mode.' }, { status: 400, headers: corsHeaders });
    }

    const rawQuestion = body.message ?? body.prompt ?? body.question;
    // Requests without a mode keep the old question-only behaviour; the Crystal
    // Ball client explicitly sends `fortune` for the daily reading.
    const mode = body.mode || (rawQuestion !== undefined ? 'follow-up' : 'fortune');
    requestMode = mode;

    let question = '';
    if (mode === 'follow-up') {
      if (typeof rawQuestion !== 'string') {
        return NextResponse.json({ error: 'Please enter a question for the Crystal Ball.' }, { status: 400, headers: corsHeaders });
      }

      // Check both the original input and its normalized form. Checking only one
      // form can miss patterns split by characters removed during sanitization.
      if (containsPromptInjection(rawQuestion)) {
        return NextResponse.json({ error: 'Invalid question format' }, { status: 400, headers: corsHeaders });
      }

      question = sanitizeText(rawQuestion);

      if (containsPromptInjection(question)) {
        return NextResponse.json({ error: 'Invalid question format' }, { status: 400, headers: corsHeaders });
      }

      if (!question) {
        return NextResponse.json({ error: 'Please enter a question for the Crystal Ball.' }, { status: 400, headers: corsHeaders });
      }

      if (question.length > 120) {
        return NextResponse.json(
          { error: 'Question is too long. Please keep it under 120 characters.' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    let fortuneContext = null;
    if (mode === 'follow-up' && body.fortune !== undefined) {
      if (typeof body.fortune !== 'string' || containsPromptInjection(body.fortune)) {
        return NextResponse.json({ error: 'Invalid fortune context.' }, { status: 400, headers: corsHeaders });
      }
      fortuneContext = sanitizeText(body.fortune).slice(0, 1500);
      if (!fortuneContext || containsPromptInjection(fortuneContext)) {
        return NextResponse.json({ error: 'Invalid fortune context.' }, { status: 400, headers: corsHeaders });
      }
    }

    const localDate =
      parseCalendarDate(body.localDate) || parseCalendarDate(getServerDateKey());
    const context = getCalendarContext(localDate.key);
    calendarContext = context;
    const timeZone = sanitizeTimeZone(body.timeZone);
    const localTime = sanitizeLocalTime(body.localTime);
    const calendarFacts = describeCalendar(context, timeZone, localTime);

    const userContent =
      mode === 'fortune'
        ? `${calendarFacts}\n\nGenerate today’s Canadian Crystal Ball fortune now.`
        : fortuneContext
          ? `${calendarFacts}\n\nThe visitor’s daily fortune: "${fortuneContext}"\n\nTheir one follow-up question: "${question}"`
          : question;

    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('Oracle Error: GROQ_API_KEY environment variable is missing.');
      return NextResponse.json(fallbackPayload(context, mode), { status: 200, headers: corsHeaders });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    let groqResponse;

    try {
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            {
              role: 'system',
              content: mode === 'fortune' ? FORTUNE_SYSTEM_PROMPT : FOLLOW_UP_SYSTEM_PROMPT,
            },
            { role: 'user', content: userContent },
          ],
          temperature: mode === 'fortune' ? 0.9 : 0.7,
          // gpt-oss-20b is a reasoning model: its internal reasoning shares the
          // completion budget. The old `max_tokens: 250` budget could be spent
          // entirely on reasoning, which returns HTTP 200 with an empty
          // `message.content` and produced the Cloudflare "Missing content in
          // Groq API response" issue. Use the supported `max_completion_tokens`
          // field, keep effort low for short readings and leave headroom for
          // reasoning plus the visible fortune.
          max_completion_tokens: 1024,
          reasoning_effort: 'low',
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      console.error('Oracle Error:', fetchError);
      return NextResponse.json(fallbackPayload(context, mode), { status: 200, headers: corsHeaders });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Oracle Error:', groqResponse.status, errorText);
      return NextResponse.json(fallbackPayload(context, mode), { status: 200, headers: corsHeaders });
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content;
    const reading = typeof content === 'string' ? content.trim() : '';

    if (!reading) {
      // Record why the content was empty so a recurrence can be diagnosed from
      // the log issue itself. Never include the prompt, reading or credentials.
      console.error(
        'Oracle Error: Missing content in Groq API response',
        JSON.stringify({
          mode,
          finishReason: data.choices?.[0]?.finish_reason ?? null,
          completionTokens: data.usage?.completion_tokens ?? null,
          reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens ?? null,
        }),
      );
      return NextResponse.json(fallbackPayload(context, mode), { status: 200, headers: corsHeaders });
    }

    return NextResponse.json(
      { prediction: reading, fortune: reading, reading, source: 'ai' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Oracle Route Exception:', error);
    return NextResponse.json(fallbackPayload(calendarContext, requestMode), { status: 200, headers: corsHeaders });
  }
}
