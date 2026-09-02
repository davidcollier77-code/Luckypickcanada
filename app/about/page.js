import Link from 'next/link';

export const metadata = {
  title: 'About the Creator | Lucky Pick Canada',
  description: 'Learn about the creator and the story behind Lucky Pick Canada, a digital entertainment experience designed to bring a little luck and magic to your day.',
};

export const dynamic = 'force-static';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-8 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-3">About the Creator</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Story</h1>
          <p className="text-lg text-slate-300">The journey behind Lucky Pick Canada</p>
        </header>

        {/* Main Content */}
        <article className="prose prose-invert prose-lg max-w-none">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Hi, I'm David</h2>
            <div className="space-y-4 text-slate-200 leading-relaxed">
              <p>
                I'm the creator behind Lucky Pick Canada. This project started as a simple idea: to build something fun, 
                positive, and uniquely Canadian that could bring a little spark of joy to people's everyday routines.
              </p>
              <p>
                I've always been drawn to the intersection of technology and creativity—finding ways to use code to create 
                experiences that feel magical, even if they're built on logic and algorithms. Lucky Pick Canada is my way 
                of combining that passion with a love for optimism, community, and the small moments that make life interesting.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">The Journey</h2>
            <div className="space-y-4 text-slate-200 leading-relaxed">
              <p>
                Lucky Pick Canada wasn't born overnight. It started with a lot of late nights, countless iterations, and 
                a genuine curiosity about what makes an experience feel engaging and meaningful. I wanted to create something 
                that people would return to—not out of obligation, but because it brought them a moment of lightness or wonder.
              </p>
              <p>
                Along the way, I learned a lot about design, user experience, and the technical challenges of building a 
                platform that feels smooth and reliable. Every feature—from the Lucky Meter to the Crystal Ball to the 
                daily card reveals—was crafted with care, tested, refined, and polished until it felt just right.
              </p>
              <p>
                The community aspect was especially important to me. I wanted Lucky Pick Canada to be more than just a 
                solo experience. The Lucky Stories feature, where people can share their own moments of good fortune, 
                became a way to connect visitors and build something that felt bigger than just one person's project.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Why Lucky Pick Canada?</h2>
            <div className="space-y-4 text-slate-200 leading-relaxed">
              <p>
                In a world that can sometimes feel heavy or overwhelming, I wanted to create a space that felt light, 
                hopeful, and fun. Lucky Pick Canada is designed to be a brief escape—a place where you can check your 
                luck for the day, discover a new card, or read a story that reminds you that good things happen.
              </p>
              <p>
                It's also proudly Canadian. From the maple leaf imagery to the coast-to-coast themes, I wanted this 
                project to celebrate the spirit of Canada—its optimism, diversity, and sense of community.
              </p>
              <p>
                Most importantly, Lucky Pick Canada is about intention. Every feature is designed to encourage positivity, 
                mindfulness, and a sense of possibility. Whether you're checking your daily resonance or sharing a lucky 
                story, the goal is always the same: to bring a little more light into your day.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">The Technical Side</h2>
            <div className="space-y-4 text-slate-200 leading-relaxed">
              <p>
                For those curious about the technical details, Lucky Pick Canada is built using modern web technologies 
                including Next.js, React, and is deployed on Cloudflare's edge network for fast, reliable performance 
                across Canada and beyond.
              </p>
              <p>
                Every aspect of the site—from the animations to the database architecture to the security measures—has 
                been carefully considered and optimized. I'm constantly learning and improving the platform, adding new 
                features and refining existing ones based on user feedback and my own vision for what Lucky Pick Canada 
                can become.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">What's Next?</h2>
            <div className="space-y-4 text-slate-200 leading-relaxed">
              <p>
                Lucky Pick Canada is an ongoing project, and I'm excited about what's ahead. I have plans for new features, 
                expanded community elements, and ways to make the experience even more engaging and delightful.
              </p>
              <p>
                If you have ideas, suggestions, or feedback, I'd love to hear from you. The Suggestion Box on the homepage 
                is always open, and I genuinely read and consider every submission. This project is as much for the community 
                as it is a personal creative endeavor.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Thank You</h2>
            <div className="space-y-4 text-slate-200 leading-relaxed">
              <p>
                Thank you for being part of the Lucky Pick Canada community. Whether you're a daily visitor or stumbled 
                upon this site by chance, I'm grateful you're here. I hope this platform brings you moments of joy, 
                curiosity, and good fortune.
              </p>
              <p className="text-amber-300 font-medium">
                Here's to luck, magic, and the little moments that make life special.
              </p>
              <p className="text-slate-300 italic">
                — David, Creator of Lucky Pick Canada
              </p>
            </div>
          </div>
        </article>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Back to Homepage
              <span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span>
            </Link>
            <Link
              href="/lucky-meter"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-amber-400 text-amber-400 font-bold transition-all duration-300 hover:bg-amber-400/10 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Check Your Luck Today →
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-sm text-slate-400">
          <p>Lucky Pick Canada is a digital entertainment experience designed for fun and positive moments.</p>
          <p className="mt-2">Not affiliated with any lottery or gambling services.</p>
        </div>
      </div>
    </div>
  );
}
