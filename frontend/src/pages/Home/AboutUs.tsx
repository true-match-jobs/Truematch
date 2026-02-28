import { Check, Headset } from '@phosphor-icons/react';

const highlights = ['Trusted Guidance', 'Transparent Process'];

export const AboutUs = () => {
  return (
    <section className="bg-dark-bg py-12 sm:py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">About Us</h2>
          <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">
            We are an international education consultancy helping students from Africa secure admissions in the
            United Kingdom and Australia.
          </p>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Our mission is to make the admission process transparent, simple, and legally compliant. We provide
            personalized guidance from application to visa approval.
          </p>

          <div className="mx-auto mt-6 flex w-full max-w-md flex-col gap-3 text-left">
            {highlights.map((item, index) => {
              const isLast = index === highlights.length - 1;

              return (
                <div key={item} className="relative flex items-center gap-3">
                  {!isLast && <span aria-hidden className="absolute left-3 top-6 h-6 w-px bg-emerald-500/50" />}
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={14} weight="bold" aria-hidden />
                  </span>
                  <p className="text-base font-medium text-zinc-200">{item}</p>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-7 w-full max-w-2xl rounded-2xl bg-dark-surface p-5 text-center glass-border sm:p-6">
            <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15 text-blue-300 sm:h-16 sm:w-16">
              <Headset size={24} weight="fill" aria-hidden />
            </span>
            <h3 className="text-base font-semibold text-zinc-100 sm:text-lg">Dedicated Support</h3>
            <p className="mt-2 text-base leading-relaxed text-zinc-400">
              Every student is assigned a dedicated officer to ensure smooth communication and support.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};