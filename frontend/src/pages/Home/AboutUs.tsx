import { Check, Headset, GlobeHemisphereWest, Briefcase } from '@phosphor-icons/react';

const highlights = [
  {
    label: 'Trusted Guidance',
    description: 'Personalized support from application to visa approval.',
  },
  {
    label: 'Transparent Process',
    description: 'Every step is handled professionally, ethically, and clearly.',
  },
];

const stats = [
  { value: 'UK & AU', label: 'Destinations' },
  { value: '100%', label: 'Legal Compliance' },
  { value: '1-on-1', label: 'Officer Support' },
];

export const AboutUs = () => {
  return (
    <section className="relative bg-dark-bg py-20 sm:py-28">

      {/* Subtle bottom glow to carry visual flow from Hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-0 h-64 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-zinc-700" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Who We Are</span>
          <span className="h-px w-10 bg-zinc-700" />
        </div>

        {/* Headline */}
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Your partner in the{' '}
          <span className="text-gradient-brand">global journey</span>
        </h2>

        {/* Body copy */}
        <div className="mx-auto mt-8 max-w-3xl space-y-4 text-center text-base leading-relaxed text-zinc-400 sm:text-lg">
          <p>
            We are an international education and workforce consultancy committed to creating global opportunities for Africans.
            Beyond helping students secure admissions in the <span className="text-zinc-200 font-medium">United Kingdom</span> and <span className="text-zinc-200 font-medium">Australia</span>, we also support foreign job seekers in connecting with verified employers abroad.
          </p>
          <p>
            We bridge the gap between talent and opportunity — whether through education or employment. Our mission is to make international study and work pathways <span className="text-zinc-200 font-medium">transparent, simple, and legally compliant</span>.
          </p>
        </div>

        {/* Stats row */}
        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 divide-x divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center py-5 px-4">
              <span className="text-xl font-bold text-white sm:text-2xl">{stat.value}</span>
              <span className="mt-1 text-xs text-zinc-500 tracking-wide">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Two-column cards */}
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Highlights */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
              <GlobeHemisphereWest size={20} weight="fill" aria-hidden />
            </div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">Our Commitments</h3>
            <div className="space-y-4">
              {highlights.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <Check size={11} weight="bold" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated Support */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Headset size={20} weight="fill" aria-hidden />
            </div>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-zinc-400">Dedicated Support</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Every applicant is assigned a dedicated officer to ensure smooth communication and personalized support throughout their study or employment journey.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Briefcase size={13} className="text-zinc-600" weight="fill" />
              <span className="text-xs text-zinc-600">Study &amp; Work abroad specialists</span>
            </div>
          </div>

        </div>

        {/* Bottom tagline */}
        <p className="mx-auto mt-10 max-w-md text-center text-sm text-zinc-600">
          We are not just consultants —{' '}
          <span className="text-zinc-400 font-medium">we are partners in your global journey.</span>
        </p>

      </div>
    </section>
  );
};
                
