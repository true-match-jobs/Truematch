import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Quotes } from '@phosphor-icons/react';

type Testimonial = {
  name: string;
  country: string;
  sex: 'Male' | 'Female';
  quote: string;
  image: string;
};

const testimonials: Testimonial[] = [
  {
    name: 'Sipho Dlamini',
    country: 'South Africa',
    sex: 'Male',
    quote: 'TrueMatch helped me secure a job abroad and made the process seamless. I am grateful for their support and guidance.',
    image: 'https://res.cloudinary.com/dykntxvyw/image/upload/v1772607267/20260304_070306_yoegff.jpg',
  },
  {
    name: 'Adaobi Okafor',
    country: 'Nigeria',
    sex: 'Female',
    quote: 'The team at TrueMatch was always available to answer my questions. My application was successful and stress-free.',
    image: 'https://res.cloudinary.com/dykntxvyw/image/upload/v1772607267/20260304_065756_u92l1d.jpg',
  },
  {
    name: 'Wanjiru Mwangi',
    country: 'Kenya',
    sex: 'Female',
    quote: 'I received excellent advice and support throughout my application. TrueMatch made everything easy!',
    image: 'https://res.cloudinary.com/dykntxvyw/image/upload/v1772607266/20260304_070033_kdpydb.jpg',
  },
  {
    name: 'Brian Otieno',
    country: 'Kenya',
    sex: 'Male',
    quote: 'Thanks to TrueMatch, I found a great opportunity and relocated smoothly. Highly recommended!',
    image: 'https://res.cloudinary.com/dykntxvyw/image/upload/v1772607266/20260304_070507_lsww2k.jpg',
  },
];

export const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = useMemo(() => testimonials.length, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % total);
    }, 9000);
    return () => window.clearInterval(id);
  }, [total]);

  const active = testimonials[activeIndex];

  return (
    <section className="relative bg-dark-bg py-20 sm:py-28">

      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-zinc-700" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Testimonials</span>
          <span className="h-px w-10 bg-zinc-700" />
        </div>

        <h2 className="mx-auto max-w-xl text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Trusted by people{' '}
          <span className="text-gradient-brand">across Africa</span>
        </h2>

        {/* Testimonial card */}
        <div className="relative mx-auto mt-12 max-w-2xl">

          {/* Decorative quote icon */}
          <div className="absolute -top-5 left-1/2 z-10 -translate-x-1/2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-brand-400">
              <Quotes size={18} weight="fill" aria-hidden />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="flex flex-col items-center px-8 pb-8 pt-10 text-center sm:px-12 sm:pb-10 sm:pt-12"
              >
                {/* Quote */}
                <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
                  &ldquo;{active.quote}&rdquo;
                </p>

                {/* Divider */}
                <div className="my-6 h-px w-12 bg-zinc-700" />

                {/* Author */}
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={active.image}
                    alt={active.name}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-500/30 sm:h-16 sm:w-16"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{active.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{active.country}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress bar */}
            <div className="h-px w-full bg-zinc-800">
              <motion.div
                key={activeIndex}
                className="h-full bg-brand-500/60"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 9, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Dot navigation */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {testimonials.map((testimonial, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={testimonial.name}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show testimonial ${index + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    isActive
                      ? 'h-2 w-6 bg-brand-500'
                      : 'h-2 w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                />
              );
            })}
          </div>

          {/* Thumbnail strip */}
          <div className="mt-5 flex items-center justify-center gap-3">
            {testimonials.map((testimonial, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={testimonial.name + '-thumb'}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show ${testimonial.name}'s testimonial`}
                  className={`rounded-full transition-all duration-300 ${
                    isActive
                      ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-dark-bg'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-8 w-8 rounded-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};
                    
