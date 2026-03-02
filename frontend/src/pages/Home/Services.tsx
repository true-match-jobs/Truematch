const services = [
  {
    id: '01',
    title: 'University Admission',
    description:
      'We help you apply to top universities in the UK and Australia with full documentation support.',
  },
  {
    id: '02',
    title: 'Document Review',
    description:
      'We review and prepare your SOP, CV, transcripts, and references to meet university standards.',
  },
  {
    id: '03',
    title: 'Visa Guidance',
    description:
      'From offer letter to CAS and visa application, we guide you through the entire process.',
  },
  {
    id: '04',
    title: 'Employment & Work Abroad Support',
    description:
      'We support qualified foreign professionals seeking employment opportunities in the UK, Canada, and Australia through structured job-readiness guidance and end-to-end relocation assistance.',
  },
];

export const Services = () => {
  return (
    <section className="bg-dark-bg pb-14 pt-4 sm:pb-16 sm:pt-6">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Our Services</h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            We guide students through every step of their international study journey.
          </p>
        </div>

        <div className="mt-10 space-y-6 sm:space-y-7">
          {services.map((service, index) => {
            const isLast = index === services.length - 1;

            return (
            <article key={service.id} className="relative flex items-start gap-4 sm:gap-5">
              {!isLast && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-[-24px] left-[18px] top-9 w-px bg-dark-border sm:bottom-[-28px] sm:left-5 sm:top-10"
                />
              )}
              <span className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-extrabold leading-none text-white sm:h-10 sm:w-10 sm:text-xl">
                {service.id}
              </span>
              <div>
                <h3 className="text-base font-semibold text-zinc-100 sm:text-lg">{service.title}</h3>
                <p className="mt-2 max-w-3xl text-base leading-relaxed text-zinc-400">{service.description}</p>
              </div>
            </article>
          );})}
        </div>
      </div>
    </section>
  );
};