import type { QuoteItem, QuoteType } from '../types'

export const DEFAULT_QUOTES: QuoteItem[] = [
  {
    quote: 'Simplicity is about subtracting the obvious and adding the meaningful.',
    author: 'John Maeda',
    category: 'simplicity',
  },
  {
    quote: 'Less, but better.',
    author: 'Dieter Rams',
    category: 'simplicity',
  },
  {
    quote: 'Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.',
    author: 'Antoine de Saint-Exupéry',
    category: 'simplicity',
  },
  {
    quote: 'Design is not just what it looks like and feels like. Design is how it works.',
    author: 'Steve Jobs',
    category: 'tech',
  },
  {
    quote: 'Focus is a practice of eliminating noise, not managing it.',
    author: 'Austin Kleon',
    category: 'mindfulness',
  },
  {
    quote: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    category: 'philosophy',
  },
  {
    quote: 'Do what you can, with what you have, where you are.',
    author: 'Theodore Roosevelt',
    category: 'philosophy',
  },
  {
    quote: 'In the middle of difficulty lies opportunity.',
    author: 'Albert Einstein',
    category: 'philosophy',
  },
  {
    quote: 'The quieter you become, the more you can hear.',
    author: 'Ram Dass',
    category: 'mindfulness',
  },
  {
    quote: 'Waste no more time arguing what a good man should be. Be one.',
    author: 'Marcus Aurelius',
    category: 'philosophy',
  },
  {
    quote: 'Nature does not hurry, yet everything is accomplished.',
    author: 'Lao Tzu',
    category: 'mindfulness',
  },
  {
    quote: 'Make it simple, but significant.',
    author: 'Don Draper',
    category: 'simplicity',
  },
  {
    quote: 'Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
    category: 'simplicity',
  },
  {
    quote: 'Clutter is not just physical stuff. It’s anything that does not serve your vision.',
    author: 'Joshua Becker',
    category: 'mindfulness',
  },
  {
    quote: 'First, solve the problem. Then, write the code.',
    author: 'John Johnson',
    category: 'tech',
  },
]

export const FALLBACK_CLASSIC_QUOTES: QuoteItem[] = [
  {
    quote: 'The best way to predict the future is to create it.',
    author: 'Peter Drucker',
  },
  {
    quote: 'To live is the rarest thing in the world. Most people exist, that is all.',
    author: 'Oscar Wilde',
  },
  {
    quote: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
  },
  {
    quote: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
  },
  {
    quote: 'Do not go where the path may lead, go instead where there is no path and leave a trail.',
    author: 'Ralph Waldo Emerson',
  },
  {
    quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
  },
  {
    quote: 'In the end, it’s not the years in your life that count. It’s the life in your years.',
    author: 'Abraham Lincoln',
  },
  {
    quote: 'You will face many defeats in life, but never let yourself be defeated.',
    author: 'Maya Angelou',
  },
]

export const FALLBACK_STOIC_QUOTES: QuoteItem[] = [
  {
    quote: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
  },
  {
    quote: 'We suffer more often in imagination than in reality.',
    author: 'Seneca',
  },
  {
    quote: 'Don’t explain your philosophy. Embody it.',
    author: 'Epictetus',
  },
  {
    quote: 'Waste no more time arguing about what a good man should be. Be one.',
    author: 'Marcus Aurelius',
  },
  {
    quote: 'Difficulties strengthen the mind, as labor does the body.',
    author: 'Seneca',
  },
  {
    quote: 'No person has the power to have everything they want, but it is in their power not to want what they haven’t got.',
    author: 'Seneca',
  },
  {
    quote: 'Wealth consists not in having great possessions, but in having few wants.',
    author: 'Epictetus',
  },
  {
    quote: 'The happiness of your life depends upon the quality of your thoughts.',
    author: 'Marcus Aurelius',
  },
]

export const FALLBACK_OFFICE_QUOTES: QuoteItem[] = [
  {
    quote: '“You miss 100% of the shots you don’t take.” — Wayne Gretzky',
    author: 'Michael Scott',
  },
  {
    quote: 'Whenever I’m about to do something, I think, “Would an idiot do that?” And if they would, I do not do that thing.',
    author: 'Dwight Schrute',
  },
  {
    quote: 'I wish there was a way to know you’re in the good old days before you’ve actually left them.',
    author: 'Andy Bernard',
  },
  {
    quote: 'There’s a lot of beauty in ordinary things. Isn’t that kind of the point?',
    author: 'Pam Beesly',
  },
  {
    quote: 'I am running away from my responsibilities. And it feels good.',
    author: 'Michael Scott',
  },
  {
    quote: 'Bears. Beets. Battlestar Galactica.',
    author: 'Jim Halpert',
  },
]

export const FALLBACK_INSPIROBOT_QUOTES: QuoteItem[] = [
  {
    quote: 'Remember to embrace the cosmic silence between your thoughts.',
    author: 'Inspirobot',
  },
  {
    quote: 'Simplicity is the algorithm of the soul.',
    author: 'Inspirobot',
  },
  {
    quote: 'Before you explore the universe, try exploring your curiosity.',
    author: 'Inspirobot',
  },
  {
    quote: 'Every day is a fresh blank canvas waiting for your attention.',
    author: 'Inspirobot',
  },
]

export const FALLBACK_HITOKOTO_QUOTES: QuoteItem[] = [
  {
    quote: 'The autumn moon shines on a calm lake, reflecting timeless stillness.',
    author: 'Eastern Wisdom',
  },
  {
    quote: 'A single leaf falls, and throughout the world autumn is known.',
    author: 'Zen Proverb',
  },
  {
    quote: 'Even the longest journey begins with a calm, deliberate step.',
    author: 'Poetic Wisdom',
  },
]

export function getFallbackQuotes(type: QuoteType = 'classic'): QuoteItem[] {
  switch (type) {
    case 'stoic':
      return FALLBACK_STOIC_QUOTES
    case 'office':
      return FALLBACK_OFFICE_QUOTES
    case 'inspirobot':
      return FALLBACK_INSPIROBOT_QUOTES
    case 'hitokoto':
      return FALLBACK_HITOKOTO_QUOTES
    case 'wisdom':
      return DEFAULT_QUOTES
    case 'classic':
    default:
      return FALLBACK_CLASSIC_QUOTES
  }
}
