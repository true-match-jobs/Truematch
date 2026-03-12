export const Footer = () => {
  return (
    <footer className="pt-12 bg-dark-bg">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-zinc-400 sm:px-6 lg:px-8">
        <div className="text-sm text-zinc-400 text-center max-w-3xl mx-auto">
          <p className="mb-2 font-semibold">Disclaimer:</p>
          <p className="mb-2">
            We are an independent education and international mobility consultancy. We are not a university, employer, immigration authority, or government agency, and we are not affiliated with or endorsed by any institution or public body in the United Kingdom, United States, Canada, or Australia.
          </p>
          <p className="mb-2">
            All admissions, employment offers, visa decisions, sponsorship approvals, and immigration outcomes are made solely by the respective universities, licensed employers, and government authorities, including but not limited to UK Visas and Immigration, U.S. Citizenship and Immigration Services, Immigration, Refugees and Citizenship Canada, and the Department of Home Affairs.
          </p>
          <p className="mb-2">
            While we provide application guidance, documentation support, and international worker-employer matching services, we do not guarantee admission, job placement, visa issuance, sponsorship approval, permanent residency, or processing timelines. Final decisions remain entirely at the discretion of the relevant institution, employer, or immigration authority.
          </p>
          <p>
            All information provided on this platform is for general guidance purposes only and may be subject to change in accordance with institutional policies and immigration regulations.
          </p>
        </div>
        <div className="my-6" />
        <div className="text-center text-sm text-zinc-400">
          © {new Date().getFullYear()} TrueMatch
        </div>
        <div className="text-center text-sm text-zinc-400 mt-2">
          Contact: <a href="mailto:support@truematch.chat" className="underline hover:text-brand-600">support@truematch.chat</a>
        </div>
      </div>
    </footer>
  );
};
