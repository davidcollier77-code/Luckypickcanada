/**
 * Curated Crystal Ball fallbacks.
 *
 * These are used only when the AI provider is unavailable. They carry the same
 * voice as the prompts: funny, warm, Canadian, varied in length and structure,
 * and appropriate to the active occasion. Respectful and thoughtful days have
 * dedicated pools that are never mixed with everyday humour.
 */

const GENERAL = [
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
  'Your luck today is the quiet, practical kind: the line moves, the lid fits, the parking meter still has time on it. Small mercies count double in November.',
  'A clever idea will arrive while you are doing something deeply unglamorous, like hunting for the matching sock. Write it down before the sock wins.',
  'Someone will say “sorry” to you today for something that is entirely their fault. Accept it graciously, then enjoy the rest of your afternoon.',
  'The mists have reviewed your week and recommend fewer tabs, more tea and one decisive nap. This is not procrastination; it is strategy with a blanket.',
  'A Canadian miracle is heading your way: the weather forecast and your plans will briefly agree. Do not question it. Just go outside.',
  'You are about to become the person who remembers the thing everyone else forgot. Try to look modest while accepting the group chat’s gratitude.',
  'An old friend, a new joke and a very average Tuesday are about to combine into an unexpectedly excellent memory. Leave room in the schedule.',
  'The glass predicts a small win with a suspiciously large feeling attached. Do not downplay it; joy is allowed to be out of proportion today.',
  'You will make a decision today that future-you quietly appreciates. It may look boring from the outside, like flossing or leaving early. Do it anyway.',
  'A conversation you have been rehearsing in the shower will go better in real life, mostly because the other person has not heard the rehearsal. Relax.',
  'Today’s luck smells faintly of butter and maple. Eat the good thing, share the better thing, and do not let the last bite go to waste.',
  'The mists see you carrying three things at once, one of which is a grudge that has overstayed its welcome. Put that one down; your arms will thank you.',
  'A perfectly timed song, a green light and a compliment from a stranger are all heading your way. That is three for three, which is basically a small Canadian miracle.',
  'Your next great idea is hiding in a conversation about nothing. Stay for the small talk; the useful part usually arrives after the weather report.',
  'Expect a friendly debate about the correct way to load a dishwasher. You will not win, but the kitchen will smell like lemon and everyone will be fine.',
  'A tiny act of organisation today will save you an absurd amount of time on Thursday. Future-you has already started a fan club.',
  'The mists see a text message you should send and one you should absolutely leave on read. Trust the difference; it is clearer than it feels.',
  'A pleasant, slightly ridiculous coincidence is heading your way. When it arrives, say “well, that’s something” and let it be a good omen.',
  'You are allowed to change your mind today, especially about something you agreed to when you were tired. The universe files this under “growth”, not “flakiness”.',
  'A warm drink, a clean window and ten minutes of quiet will unlock a thought you have been chasing all week. The thought has been waiting there the whole time.',
  'Someone will notice the thing you fixed without being asked. They may only say “oh, nice”, but in Canadian that is practically a parade.',
  'The mists are not promising fireworks today. They are promising a good sandwich, a clear head and one small thing going exactly right. Honestly? A solid Tuesday.',
];

const SEASONAL = {
  winter: [
    'Winter is doing its full dramatic performance today, so dress like you mean it and let the cold sharpen your good ideas. A warm welcome is waiting closer than the forecast suggests.',
    'The snow makes everything quieter, which is exactly the space you need for a clever thought. Give yourself ten unhurried minutes and the answer will arrive wearing a toque.',
    'A bright, cold morning is hiding a warm little surprise. Keep your mittens handy, your expectations flexible and your sense of humour fully charged.',
    'The season of early sunsets is also the season of excellent excuses to stay in and get things done. One small task finishes easily today, and it changes the whole mood.',
    'Winter luck arrives like a perfectly timed snow day: quietly, then all at once. Make room for an unexpected pause and see what it makes possible.',
    'The frost is drawing patterns on the window and a good idea on the edge of your attention. Stay warm, stay curious and let the day unfold at a human pace.',
    'The cold has opinions, but you have layers, a decent pair of boots and the quiet confidence of someone who checked the forecast. That is a winning combination.',
    'A snowy walk will untangle a knot that three cups of coffee could not. Bring the good mittens and let the crisp air do the editing.',
    'The season of early dark is also the season of excellent lamps. Make one corner of your home unreasonably cosy and your whole week will improve.',
    'A small winter kindness — scraping a neighbour’s windshield, sharing a mug, letting someone merge — will come back to you before the thaw.',
  ],
  spring: [
    'Spring is practising its comeback, and so are you. A fresh start that felt too late is simply waiting for the next warm afternoon; begin with one small, hopeful thing.',
    'The melt is revealing new ground, and a stalled plan is revealing a better route. Give it a little sunlight and do not be surprised when it grows faster than expected.',
    'A muddy-boots kind of day brings a clean, useful idea. Say yes to the walk, the chat or the second attempt; the season is on your side.',
    'Maple sap is rising and so is your momentum. Something you planted in patience is finally showing green; keep watering it without checking the clock every five minutes.',
    'Spring weather cannot make up its mind, and neither can an opportunity that keeps circling back. Choose the version that feels lighter, and the rest will settle.',
    'A cheerful little coincidence arrives with the warmer air. Let yourself be delighted for a moment; delight is a perfectly sensible strategy today.',
    'The first genuinely warm afternoon is coming, and it will make everyone forget they ever complained about the cold. Be suspiciously cheerful; it is seasonal.',
    'A puddle, a pair of boots and one reckless step are about to teach you something about optimism. Choose the dry route and the good mood.',
    'Something you gave up on is showing a small green shoot. Do not dig it up to check the roots; let it grow for another week.',
    'The birds are back and so is your energy. Channel it into one useful thing before the itch to reorganise the entire garage takes over.',
  ],
  summer: [
    'Summer is stretching out like a long weekend, and your best move is to leave a little room in the schedule. The unplanned part of the day carries the good news.',
    'The sun is doing its enthusiastic thing, so pace yourself like a sensible Canadian at a backyard barbecue. A cold drink, a shady chair and one good conversation will reset the whole week.',
    'A bright afternoon brings a bright idea, though it may arrive while you are doing something completely unrelated. Keep a pen nearby and let the thought finish.',
    'The season of open windows and late light is nudging you toward a generous little risk. Try the thing that makes the day feel wider; you do not need to overthink it.',
    'A familiar summer sound — a screen door, a distant lawn mower, a lake at dusk — carries a small piece of good news. Notice the ordinary magic and let it count.',
    'Your luck is running warm today, like a dock in the afternoon sun. Take the invitation, make the plan and leave enough time to enjoy the walk back.',
    'A long evening, a cold drink and a chair that is slightly too comfortable are the whole plan. Do not improve it with ambition.',
    'The mists predict a mosquito will find you at the exact moment you sit down. Consider this fair warning and a cosmic nudge to bring the citronella.',
    'A summer storm will arrive just after you wash the car. Laugh, wait it out, and enjoy the smell of wet pavement; that part is free.',
    'Someone will suggest a road trip and you will say “maybe” far too quickly. The maybe is your answer. Pack snacks.',
  ],
  autumn: [
    'Autumn is handing out golden light and a reason to slow down. The thing you have been rushing may only need one more thoughtful look before it makes sense.',
    'A crisp morning brings a clear answer, even if it arrives after the second coffee. Bundle up, take the longer route and let the fresh air do its quiet work.',
    'The leaves are changing and so is a plan you thought was settled. This shift is friendly; it is making room for something you actually want.',
    'Harvest season suits you today: gather the small wins, thank the people who helped and do not leave the good parts uneaten. There is more abundance here than the list suggests.',
    'A cosy, practical kind of luck follows you today. Fix the small annoyance, make the warm drink and watch how much lighter the afternoon becomes.',
    'The season of scarves and second thoughts is asking you to choose the warmer option. In people, in plans and in the last slice of pie, warmth is the right measure.',
    'The light is doing its golden-hour thing earlier every day, and a small decision is about to look much clearer in it. Take the photo, make the plan.',
    'A crisp leaf, a warm sweater and one honest conversation will make this week feel like the good part of a movie. You do not need a bigger plot.',
    'The mists see you pretending not to need a break. Autumn disagrees. Take the long way home and let the colours make the argument.',
    'A recipe you have been meaning to try is about to become your entire personality for the weekend. Invite someone who brings good bread.',
  ],
};

const OCCASION_POOLS = {
  'new-years-day': [
    'A brand-new calendar is a lovely thing, but you do not need a dramatic resolution today. Choose one small habit that makes tomorrow easier, and let the rest of the year catch up.',
    'The first day of the year is mostly a promise with better lighting. Make one gentle plan, leave room for a nap and trust that the year will have opinions of its own.',
    'A fresh start arrives with sensible footwear and a slightly unrealistic list. Keep the list short, keep the coffee strong and let the first good surprise find you.',
    'The mists see a year with more room in it than last year’s version. Begin with something you can actually finish today, and let momentum handle the rest.',
    'January 1 is a blank page with a coffee ring already on it, and that is fine. Start with one small, doable thing and let the year earn its plot.',
    'The mists see a quiet morning, a long walk and a plan that is more “be kinder” than “win everything”. That is a strong opening chapter.',
  ],
  'valentines-day': [
    'Valentine’s Day does not require a grand gesture; the mists are more impressed by a genuinely kind one. Send the message, share the chocolate and let warmth be the whole strategy.',
    'A small, thoughtful act lands like a warm cinnamon bun today. Whether the day is romantic, friendly or happily solo, make room for the people who make you laugh.',
    'The glass shows a heart that knows the difference between a performance and a kindness. Choose the sincere version, even if it is a little awkward, and it will be remembered.',
    'Love, in all its forms, is doing a quiet Canadian thing today: showing up with coffee and not making a fuss. Notice who does that for you and return the favour.',
    'A small kindness will land better than a grand gesture today. Remember how someone takes their coffee and you will be halfway to a perfect Valentine.',
    'The mists are fond of the awkward, sincere version: the card that says too much, the slightly burnt dinner, the laugh in the middle of a serious moment.',
    'Today is a good day to be gentle with yourself, whether you are coupled, complicated or cheerfully solo. Warmth is not a couples-only activity.',
  ],
  'good-friday': [
    'A quiet day suits a quiet answer. Step back from the noise, make space for one honest thought and let the rest of the weekend arrive without a performance.',
    'The mists recommend a slower pace and a kinder inner voice today. Not every question needs solving before supper; some just need room to breathe.',
    'A pause is not a setback. Today’s good fortune is the clarity that arrives when you stop carrying everyone else’s urgency for an hour.',
    'There is a gentle sort of luck in keeping things simple today. A warm meal, a familiar face and one unfinished worry left on the shelf will do nicely.',
  ],
  easter: [
    'Easter brings a gentle reset and a suspicious amount of chocolate. Let something small be reborn today: a habit, a hope or a conversation you thought was finished.',
    'The mists see a fresh beginning hiding among the spring colours. You do not have to understand the whole story yet; just take the next hopeful step.',
    'A warm gathering or a quiet morning offers the same useful message today: there is more room for renewal than you think. Be kind to the version of you that is still learning.',
    'Something you set aside is ready for a second chance, like a spring bulb that did not read the calendar. Give it light, patience and a little less pressure.',
    'A chocolate egg will be found in a coat pocket weeks from now, and today is the day it gets hidden. The mists see a small, silly tradition taking root.',
    'The season of second chances is offering you one that does not require a grand announcement. Take the small fresh start and enjoy the spring light.',
  ],
  'mothers-day': [
    'Mother’s Day is a good day to remember the small things: the packed lunch, the worry, the phone call that always started with “just checking in”. Say the thing you mean.',
    'A handmade card, a shared coffee or a long-overdue catch-up will matter more than anything with a price tag. The mists are firm on this one.',
    'For anyone mothering, being mothered or missing someone today, a gentle moment is waiting. Let the day be warm, not perfect.',
    'A family group chat will produce one chaotic plan and one genuinely lovely moment. Take the lovely one and leave the logistics alone.',
  ],
  'victoria-day': [
    'The long weekend has officially arrived, and so has your permission to do less. Make a plan with room for a patio chair, a friend and absolutely no unnecessary rushing.',
    'Victoria Day brings the first real taste of summer and a suspiciously optimistic forecast. Pack the layers, bring the snacks and let the afternoon wander where it likes.',
    'A holiday Monday is a fine time to remember that good luck often looks like unscheduled time. Spend a little of it on something that makes you laugh.',
    'The mists see fireworks, or at least a very good backyard conversation. Either way, the evening is on your side; leave the phone inside for a while.',
    'The long weekend has that first-taste-of-summer feeling, even if the forecast is doing its usual Canadian improv. Pack a sweater and a good attitude.',
    'A patio chair, a friend who brings snacks and a plan with no fixed hour are the whole recipe. Do not overbook the freedom.',
  ],
  'fathers-day': [
    'Father’s Day is a fine time to appreciate the quiet stuff: the advice you ignored, the tools you borrowed and the jokes that somehow got funnier with age.',
    'A burger, a bad pun and a sincere “thanks” are the mists’ recommended recipe today. Adjust the portions to taste.',
    'Someone in your life is better at showing up than saying it. Notice that today, and meet them halfway.',
    'The mists see a project in the garage that has been “almost finished” for three years. You are not required to fix it; just enjoy the optimism.',
  ],
  'canada-day': [
    'Canada Day suits you: a little proud, a little playful and happiest when everyone has a place at the table. Celebrate something small and true today, eh?',
    'The mists see red and white, a warm breeze and a plan that gets better the longer you stay outside. Bring the sunscreen and your best terrible joke.',
    'A country-sized celebration is lovely, but your good fortune today is personal: a shared laugh, a familiar song and the feeling of belonging somewhere.',
    'Fireworks are fine, but the real spark today is a conversation that reminds you how much room there is for kindness in this big, weather-confused country.',
    'Canada, baby! Today is for red and white, a warm breeze and the kind of neighbourhood gathering where someone inevitably brings too much potato salad. Embrace it.',
    'The mists see a country-sized celebration and a very personal good fortune: a seat near the people you like, a plate that does not run out and a laugh that carries.',
    'Canada Day suits a country that apologised its way into a confederation and still knows how to throw a good party. Be proud, be kind, be a little ridiculous.',
    'Somewhere between the fireworks and the last of the daylight, a small moment will make you glad you live here. That is the whole celebration, eh?',
  ],
  'labour-day': [
    'The last long weekend of summer has arrived, and your good fortune is a slow morning with nowhere urgent to be. Make the most of the extra day, eh?',
    'Labour Day is a fine time to notice how much you have carried this season. Put down one unnecessary task and let the afternoon be pleasantly unproductive.',
    'Labour Day is asking you to notice the work you do every day, including the invisible kind. Give yourself a proper break, not a guilty one.',
    'A slow breakfast and a small tidy-up will make the extra day feel longer. Use the rest of it on something that has nothing to do with productivity.',
    'The season is turning, and so is your schedule. Make one gentle adjustment now and thank yourself in October.',
  ],
  'truth-reconciliation': [
    'Today asks for reflection. Make space to listen, to learn and to consider the history carried by Indigenous communities across Canada.',
    'Reconciliation grows through small, sincere choices: listening without interrupting, learning without demanding a performance, and carrying that understanding forward.',
    'The mists are quiet today. Let the day hold room for truth, care and a commitment to doing better in ordinary ways.',
    'A thoughtful conversation can begin with simply asking and then listening. Today is a good day to make that space.',
  ],
  thanksgiving: [
    'Thanksgiving asks for gratitude, and the mists are pleased to report there is more of it within reach than the busy week suggests. Name three ordinary good things and watch the day soften.',
    'A harvest-sized plate and a generous second helping of patience are the right portions today. Someone at the table has a story worth hearing; make room for it.',
    'The season of gathering reminds you that support often arrives in casseroles and inconveniently timed phone calls. Accept both; they count.',
    'Your good fortune today is the kind you can pass around. Share the credit, save the last piece for someone else and notice how much lighter the whole table feels.',
    'A second helping of pie is a perfectly reasonable way to honour the harvest. So is a second helping of patience with the person who always brings up that story.',
    'The mists see a table with one chair too few and a plate that can stretch. Make room; the best conversations arrive late.',
  ],
  halloween: [
    'Halloween is the one night when a little mystery is practically a public service. Dress up, play along and let the spooky part stay firmly on the entertainment side of the street.',
    'The mists are wearing their dramatic cape today. Expect a pleasant fright, a clever costume and a sugar rush that makes the whole evening feel slightly enchanted.',
    'A playful disguise suits you better than a serious plan tonight. Knock on the door, take the candy and leave the overthinking at home with the porch light on.',
    'Something delightfully odd crosses your path today. Enjoy the theatrics, keep your sense of humour handy and remember that real magic is mostly good timing and good company.',
    'A costume that is 60% commitment and 40% whatever was in the closet will be a hit. Confidence is the real accessory.',
    'Expect one genuinely clever costume, one deeply confusing one and a bowl of candy you will raid later. A balanced holiday.',
  ],
  'remembrance-day': [
    'Today asks for a quieter kind of attention. Take a moment to remember, then carry that care into something ordinary and good: a call, a kindness, a little more patience.',
    'The mists are still today. Gratitude, remembrance and a gentle pace belong together; let the rest of the world hurry on without you for a few minutes.',
    'A small act of respect can change the temperature of an entire day. Pause, remember and let the peace you make room for travel further than you expect.',
    'There is strength in remembering without turning the day into a performance. Keep it sincere, keep it warm and be kind to the people carrying older stories.',
    'Take the minute. Wear the poppy if you wear one. Let the ordinary kindness that follows be the way you carry the day.',
  ],
  'christmas-day': [
    'Christmas arrives with its familiar magic: a warm kitchen, a little chaos and at least one gift that gets a genuine laugh. Let the imperfect version be the one you enjoy.',
    'The mists see a day made of small kindnesses rather than perfect plans. Share the last cookie, call someone who would love to hear your voice and let the rest be enough.',
    'A cosy, candlelit sort of luck follows you today. The best moment may be unplanned, unpaid and slightly off-key; that is usually how the good ones arrive.',
    'There is more warmth in the room than the wrapping paper suggests. Notice who made it happen, thank them properly and save a little quiet for yourself.',
    'Christmas Day is here, and the mists are pleased to report that the best part is not under the tree. It is the person who makes you laugh while the potatoes are doing whatever they are doing.',
    'Somewhere between the wrapping paper and the second helping, a quiet moment will find you. Let it stay a minute; that is the gift with no receipt.',
  ],
  'boxing-day': [
    'Boxing Day has the good sense to be relaxed: a little more coffee, a little less rushing and a legitimate excuse to wear the new socks immediately.',
    'The mists see a fridge full of Tupperware and a plan involving nothing more strenuous than a nap. This is not laziness; it is recovery with leftovers.',
    'A small cleanup, a good deal on something you actually needed and one friendly queue will make today feel easier than advertised. Keep the receipt.',
    'The last of the Christmas cookies is about to be claimed. Claim it with confidence; the season has given you permission.',
    'New Year’s is starting to peek around the corner, but today belongs to leftovers, leftovers and one more chapter of your book.',
  ],
  'new-year-anticipation': [
    'The year is packing its bags, and you are allowed to feel both tired and hopeful at the same time. One honest look back is enough; then look ahead.',
    'A small New Year’s intention is beginning to form. Keep it kind and specific, like “more walks” rather than “become a completely different person by Thursday”.',
    'The mists see a list you do not need to finish and a fresh calendar you do not need to fill in yet. Leave a little blank space for the good surprises.',
    'An invitation for New Year’s Eve is heading your way, along with a perfectly reasonable excuse to leave early if you want. Both are lucky.',
    'You will hear someone make a bold resolution and quietly decide to make a smaller, better one. The smaller one is more likely to survive January.',
  ],
  'new-years-eve': [
    'New Year’s Eve is here, and the mists recommend celebration over perfection. The best party is the one where everyone is comfortable, fed and mildly ridiculous.',
    'A countdown, a warm drink and one person who makes you laugh: that is a complete New Year’s Eve. Everything else is confetti.',
    'You will look back at this year and find one memory that makes you smile and one lesson that makes you wiser. Take both into midnight.',
    'The mists predict a slightly chaotic toast and a genuinely good hug. Keep your expectations festive and your resolutions flexible.',
    'Tonight is less about the perfect outfit and more about the people who are glad you showed up. Bring the good mood; the rest is optional.',
  ],
  'christmas-early': [
    'There is a faint smell of cinnamon in the air and a very small Christmas thought in the back of your mind. Let it be a quiet one for now; December has only just started.',
    'A string of lights, a good mug and one afternoon with nowhere to be are enough to make the season feel real. No need to rush the magic.',
    'A tiny festive tradition is waiting to be invented this week. It does not need wrapping paper or a guest list; it just needs ten minutes you actually enjoy.',
    'The mists see a Christmas card list, a forgotten roll of tape and one genuinely good idea. Start small and let the tinsel find you later.',
    'A warm kitchen and a slightly crooked decoration are in your near future. Perfection is not required; the season is happy to meet you halfway.',
    'You will hear a song you love in a shop and forget what you came in for. Consider that a successful errand.',
  ],
  'christmas-growing': [
    'The season is starting to hum now: a parcel on the step, a plan that actually works and one playlist that makes the kitchen feel warmer. Enjoy the build.',
    'A Christmas cookie will be eaten slightly too early and it will be the best one. The mists do not judge; the mists also had one.',
    'Someone in your circle is carrying a little more than they let on. A small, no-fuss kindness will land better than a perfect gift.',
    'The good news today arrives with a ribbon of ordinary luck: a parking spot, a friendly queue, a recipe that finally behaves. Wrap it up and keep it.',
    'A festive plan will change at the last minute and end up better than the original. Say yes to the revised version and bring the good cheese.',
    'The mists see a kitchen counter covered in flour and a very good laugh. That is not chaos; that is the holiday spirit with sleeves rolled up.',
  ],
  'christmas-eve': [
    'The magic is at full volume now: a warm room, a plate of something sweet and at least one person who knows your coffee order. That is the real Christmas inventory.',
    'A last-minute errand will go better than expected, mostly because everyone is too tired to be difficult. Smile, wave, take the good parking spot.',
    'The mists see a small, last-minute gift that means more than the expensive one. It is the thought, the timing and the fact that you remembered.',
    'A Christmas Eve that does not go exactly to plan will still be the one you remember fondly. Leave room for the unscripted part.',
    'You will laugh at something ridiculous tonight and forget to check the clock. That is the whole point of the season, eh?',
  ],
  'canada-day-build-up': [
    'Canada Day is a week away, and the mists are already humming something patriotic. Start small: a red shirt, a good snack and an unreasonable amount of optimism about the weather.',
    'A very Canadian countdown has begun: six days until Canada Day. Make one plan that involves friends, one that involves food and one that involves absolutely nothing.',
    'The maple leaf is warming up. Five days to Canada Day, and the mists recommend practising your best “eh?” in the mirror.',
    'Canada Day is closing in, and so is the annual debate about the correct way to celebrate. The mists vote for snacks, friends and a patio.',
    'Two days until Canada Day. The country is not a monolith, but the enthusiasm for a long weekend is pleasantly universal.',
    'Tomorrow is Canada Day. Charge the camera, chill the drinks and prepare a patriotic playlist with at least one song everyone will argue about.',
  ],
};

function withFortuneIds(pool, prefix) {
  return pool.map((text, index) => ({
    id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
    text,
  }));
}

// Stable identifiers for every curated daily fortune. They are derived from the
// pool namespace and the reading's position, so the same reading keeps the same
// ID across page loads while never sharing an ID with another pool.
const GENERAL_ENTRIES = withFortuneIds(GENERAL, 'general');
const SEASONAL_ENTRIES = Object.fromEntries(
  Object.entries(SEASONAL).map(([season, pool]) => [
    season,
    withFortuneIds(pool, `seasonal-${season}`),
  ]),
);
const OCCASION_ENTRIES = Object.fromEntries(
  Object.entries(OCCASION_POOLS).map(([key, pool]) => [
    key,
    withFortuneIds(pool, `occasion-${key}`),
  ]),
);

function pickEntry(entries, random) {
  if (!entries || entries.length === 0) return null;
  const roll = Math.min(Math.max(Number(random()) || 0, 0), 0.999999);
  return entries[Math.floor(roll * entries.length)];
}

/**
 * Choose a fallback reading that suits the active occasion. Respectful and
 * thoughtful days use only their own quiet pool, so a provider outage can
 * never produce a joke on a commemorative day.
 *
 * The optional `excludeId` removes one reading (and every weighted copy of it)
 * before selection. Seasonal and occasion pools remain the only candidates, so
 * consecutive-day variety never weakens holiday relevance.
 *
 * @param {object | null} context Calendar context, or null on an early failure.
 * @param {() => number} [random] Injectable random source for tests.
 * @param {{ excludeId?: string | null }} [options]
 */
export function getFallbackFortuneEntry(context, random = Math.random, options = {}) {
  const { excludeId = null } = options;
  const poolKey = context?.focus?.poolKey;
  const occasionEntries = poolKey ? OCCASION_ENTRIES[poolKey] : null;
  const seasonalEntries = SEASONAL_ENTRIES[context?.season] || [];

  let entries;
  if (occasionEntries?.length) {
    entries =
      context.tone === 'respectful' || context.tone === 'thoughtful'
        ? occasionEntries
        : [...occasionEntries, ...occasionEntries, ...seasonalEntries];
  } else {
    entries = [...seasonalEntries, ...seasonalEntries, ...GENERAL_ENTRIES];
  }

  const eligible = excludeId
    ? entries.filter((entry) => entry.id !== excludeId)
    : entries;

  return pickEntry(eligible.length ? eligible : entries, random);
}

/**
 * Return the reading text for existing callers. `getFallbackFortuneEntry()`
 * additionally supplies the stable ID used for consecutive-day variety.
 *
 * @param {object | null} context
 * @param {() => number} [random]
 * @param {{ excludeId?: string | null }} [options]
 */
export function getFallbackFortune(context, random = Math.random, options = {}) {
  return getFallbackFortuneEntry(context, random, options)?.text || '';
}

/**
 * Occasionally open an everyday fallback with the visitor's local greeting so
 * time awareness survives a provider outage. Solemn days are never prefixed
 * with a cheerful greeting.
 *
 * @param {string} reading
 * @param {object | null} context
 * @param {() => number} [random]
 */
export function addTimeGreeting(reading, context, random = Math.random) {
  if (!reading) return reading;
  if (!context?.timeOfDay) return reading;
  if (context.tone === 'respectful' || context.tone === 'thoughtful') return reading;
  if (random() >= 0.35) return reading;

  const greeting = context.timeOfDay.greeting;
  if (!greeting || reading.startsWith(greeting)) return reading;
  return `${greeting} ${reading}`;
}

export const FALLBACK_POOLS = {
  general: GENERAL,
  seasonal: SEASONAL,
  occasion: OCCASION_POOLS,
};

// Identifier-bearing view of the same 197 daily readings. Kept separate from
// FALLBACK_POOLS so existing callers and tests can keep working with strings.
export const FALLBACK_ENTRIES = {
  general: GENERAL_ENTRIES,
  seasonal: SEASONAL_ENTRIES,
  occasion: OCCASION_ENTRIES,
};
