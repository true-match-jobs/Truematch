import { useEffect, useMemo, useState } from 'react';

type Testimonial = {
  name: string;
  location: string;
  quote: string;
  image: string;
};

const testimonials: Testimonial[] = [
  {
    name: 'Amina Yusuf',
    location: 'Lagos, Nigeria',
    quote:
      'Truematch made my UK admission process simple and clear. Their team reviewed every document and guided me until I received my offer.',
    image:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Kwame Mensah',
    location: 'Accra, Ghana',
    quote:
      'From choosing programs to visa preparation, I had support at every step. The process felt transparent, fast, and professional.',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Linet Njeri',
    location: 'Nairobi, Kenya',
    quote:
      'I appreciated the personalized advice and quick communication. My Australia application was handled with confidence and precision.',
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  },
];

export const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = useMemo(() => testimonials.length, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % total);
    }, 5000);
    return () => window.clearInterval(id);
  }, [total]);

  const active = testimonials[activeIndex];

  return (
    <section className="bg-dark-bg pb-16 pt-8 sm:pb-20 sm:pt-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Testimonials</h2>
        </div>

        <div className="relative mx-auto max-w-4xl rounded-2xl p-6 sm:p-8">
          <div key={activeIndex} className="animate-fade-in flex flex-col items-center text-center">
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
              <p className="text-base font-semibold text-zinc-100">{active.name}</p>
              <p className="text-sm text-zinc-400">{active.location}</p>
            </div>
          </div>

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
