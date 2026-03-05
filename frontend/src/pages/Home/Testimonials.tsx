import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
    }, 9000); // Increased interval for readability
    return () => window.clearInterval(id);
  }, [total]);

  const active = testimonials[activeIndex];

  return (
    <section className="bg-dark-bg pb-16 pt-8 sm:pb-20 sm:pt-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Title removed as requested */}

        <div className="relative mx-auto max-w-4xl rounded-2xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="flex flex-col items-center text-center"
            >
              <img
                src={active.image}
                alt={active.name}
                className="mt-3 h-20 w-20 rounded-full object-cover ring-2 ring-white/10 sm:h-24 sm:w-24"
                loading="lazy"
              />

              <div className="mt-6 w-full max-w-2xl px-2 text-zinc-300 sm:px-4">
                <p className="text-base leading-relaxed sm:text-lg">&quot;{active.quote}&quot;</p>
              </div>

              <div className="mt-4">
                <p className="text-base font-semibold text-zinc-100">{active.name},</p>
                <p className="text-sm text-zinc-400">{active.country}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-7 flex items-center justify-center gap-2">
            {testimonials.map((testimonial, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={testimonial.name}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show testimonial ${index + 1}`}
                  className={`h-2 w-2 rounded-full transition-colors duration-300 ease-out ${isActive ? 'bg-white' : 'bg-zinc-600 hover:bg-zinc-500'}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
