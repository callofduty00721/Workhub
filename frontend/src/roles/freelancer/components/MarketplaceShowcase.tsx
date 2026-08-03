const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Infosys",
  "TCS",
  "Adobe",
];

export default function MarketplaceShowcase() {
  return (
    <section className="bg-white">

      <div className="container py-10">

        {/* Trusted */}

        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
            Trusted By
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-10">

            {companies.map((company) => (
              <div
                key={company}
                className="text-xl font-bold text-slate-400 transition hover:text-slate-900"
              >
                {company}
              </div>
            ))}

          </div>

        </div>

      </div>

    </section>
  );
}
