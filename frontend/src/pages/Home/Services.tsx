import { BookOpenText, FileSearch, Stamp, Briefcase } from '@phosphor-icons/react';

const services = [
  {
    id: '01',
    icon: BookOpenText,
    title: 'University Admission',
    description:
      'We help you apply to top universities in the UK and Australia with full documentation support.',
    accent: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    id: '02',
    icon: FileSearch,
    title: 'Document Review',
    description:
      'We review and prepare your SOP, CV, transcripts, and references to meet university standards.',
    accent: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    id: '03',
    icon: Stamp,
    title: 'Visa Guidance',
    description:
      'From offer letter to CAS and visa application, we guide you through the entire process.',
    accent: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    id: '04',
    icon: Briefcase,
    title: 'Employment & Work Abroad Support',
    description:
      'We support qualified foreign professionals seeking employment opportunities in the UK, Canada, and Australia through structured job-readiness guidance and end-to-end relocation assistance.',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
];

export const Services = () => {
  return (
    <section className="relative bg-dark-bg py-20 sm:py-28">

      {/* Faint glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 z-0 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(109,40,217,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-zinc-700" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">What We Offer</span>
          <span className="h-px w-10 bg-zinc-700" />
        </div>

        {/* Headline */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Our <span className="text-gradient-brand">Services</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            We guide students and foreign job seekers through every step of their international study and employment journey.
          </p>
        </div>

        {/* Cards grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.id}
                className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
              >
                {/* ID watermark */}
                <span className="absolute right-5 top-4 font-mono text-xs font-bold text-zinc-800 select-none">
                  {service.id}
                </span>

                {/* Icon */}
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${service.bg} ${service.accent}`}>
                  <Icon size={20} weight="fill" aria-hidden />
                </div>

                {/* Text */}
                <h3 className="text-base font-semibold text-zinc-100 sm:text-lg">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{service.description}</p>

                {/* Bottom accent line on hover */}
                <div className={`absolute bottom-0 left-6 right-6 h-px scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100 ${service.bg.replace('/10', '/40')}`} />
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
};
          
