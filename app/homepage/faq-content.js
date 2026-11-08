/**
 * Canonical homepage FAQ content.
 *
 * The visible accordion (`FAQSection.js`) and the FAQPage structured data
 * emitted by `app/page.js` both read this module, so the questions and answers
 * a visitor reads can never drift from what search engines are given.
 *
 * Answers may contain blank lines. The visible accordion renders each block as
 * its own paragraph; the structured data keeps the same text.
 */
export const faqItems = [
  {
    question: 'How does the Daily Lucky Card generator work?',
    answer:
      'Every day brings a chance to discover a new Lucky Card! Reveal your daily card, add it to your personal collection, and see which cards you uncover along the way. Some cards are rarer than others, making each reveal a little surprise. And keep an eye out — you never know when new cards might join the collection!',
  },
  {
    question: 'What is the Luck Generator, and how does it work?',
    answer:
      "The Luck Generator gives you a fun daily reading with a little Canadian inspiration! Discover your daily luck percentage, enjoy an uplifting quote, and watch your result come to life with a special visual reveal. Come back tomorrow for another reading! It's all for fun and isn't a prediction of future events.",
  },
  {
    question: 'Is Lucky Pick Canada free to use?',
    answer:
      "Yes! Many of the experiences on Lucky Pick Canada are free to enjoy, including the Luck Generator, Crystal Ball, and Lucky Community Stories. We also offer optional paid experiences, including Lucky Reveals — a Personal Reveal or a Gift Reveal. You can explore the site and choose what you'd like to enjoy.",
  },
  {
    question: 'What are Lucky Community Stories and the Community Map?',
    answer:
      "Lucky Community Stories are shared by people from across Canada, and they show that luck can mean something different to everyone. It might be a funny coincidence, an unexpected helping hand, a life-changing moment, a second chance, or simply being lucky to be here.\n\nOur interactive Community Map lets you explore stories from across the country, see how many stories are being shared from each province and territory, and discover which areas are contributing to our growing collection. You can browse different regions, read other people's experiences, celebrate the stories that resonate with you, and see each story's celebration count. You can also share a lucky story of your own!",
  },
  {
    question: 'Is Lucky Pick Canada intended for entertainment?',
    answer:
      "Absolutely! Lucky Pick Canada is a Canadian entertainment experience designed to bring a little fun, curiosity, and inspiration into everyday life. Our lucky numbers, readings, cards, and other experiences are for entertainment purposes only. We are not a lottery operator or gambling service, and we don't offer lottery prizes, winning guarantees, or real-money payouts.",
  },
  {
    question: 'How does the Gift Reveal work?',
    answer:
      "Our Gift Reveal lets you send someone a little touch of luck! Once purchased, the recipient receives an email with a special link to their own interactive reveal. They can enjoy discovering their lucky numbers and other personalized lucky details through an animated experience. It's a fun little surprise to share with someone special!",
  },
  {
    question: 'What is the Lucky Crystal Ball, and how does it work?',
    answer:
      "Have a question on your mind? Our Crystal Ball offers playful, AI-powered readings with a little Canadian magic, mystery, and imagination. Simply enter your question, enjoy the reveal, and see what unexpected message appears! You can ask up to three questions each day. It's all about having fun and enjoying a little Canadian-inspired mystery!",
  },
  {
    question: 'When do the daily experiences reset?',
    answer:
      "Your Daily Lucky Card, Luck Generator, and Crystal Ball question allowance reset once a day at midnight local time. That means there's always another opportunity to discover a new card, enjoy another daily reading, or ask the Crystal Ball another question!",
  },
  {
    question: 'What are the activity counters?',
    answer:
      "You'll notice activity counters on experiences like the Luck Generator and Crystal Ball. They give you a glimpse of how much activity these features are getting from visitors. It's a fun way to see the Lucky Pick Canada community enjoying the experiences!",
  },
  {
    question: 'What do the purchase counters mean?',
    answer:
      "Some of our paid Lucky Pick experiences include a counter showing how many times that experience has been purchased. It's a fun way to see how many people have chosen to enjoy or share a little touch of luck!",
  },
];

export default faqItems;
