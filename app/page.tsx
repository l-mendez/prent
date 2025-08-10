import Image from "next/image";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_50%_-10%,theme(colors.brand/20),transparent_60%),radial-gradient(30%_20%_at_80%_10%,theme(colors.cyan.400/20),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="max-w-2xl">
            <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight">
              AI orchestration for hospital operations
            </h1>
            <p className="mt-4 text-base sm:text-lg text-black/70 dark:text-white/70 max-w-xl">
              Prent AI streamlines patient flow, reduces operational delays, and uncovers revenue integrity opportunities across your hospital network.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#demo" className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-white font-medium shadow-sm hover:brightness-110">
                Book a demo
              </a>
              <a href="#how" className="inline-flex items-center justify-center rounded-full border border-black/10 dark:border-white/20 px-6 py-3 font-medium hover:bg-black/5 dark:hover:bg-white/5">
                How it works
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-10">
        </div>
      </section>

      {/* Value props */}
      <section id="solutions" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "More efficient consultations",
              desc: "Use AI to speed up consultations and reduce wait times.",
              icon: "/icons/capacity.svg",
            },
            {
              title: "Light the weight on medics",
              desc: "By automating processes, medics can focus on what they do best.",
              icon: "/icons/coordination.svg",
            },
            {
              title: "Better patient outcomes",
              desc: "Pacients spend less time in the hospital and get better care.",
              icon: "/icons/revenue.svg",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-black/10 dark:border-white/10 p-6 bg-white/60 dark:bg-white/5 backdrop-blur">
              <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center mb-4">
                <Image src={item.icon} alt="" width={24} height={24} />
              </div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Deploy in weeks, not months.</h2>
            <p className="mt-4 text-black/70 dark:text-white/70">
              We integrate using industry-standard interfaces and a secure, audit-ready data plane. Start with one service line and expand across your network.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-brand" /> Pilot in one department</li>
              <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-brand" /> Works with your existing tools</li>
              <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-brand" /> No heavy lift for IT</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="demo" className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-8 text-center bg-brand/5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">See Prent AI in action</h2>
          <p className="mt-2 text-black/70 dark:text-white/70">Request a walkthrough tailored to your hospital’s needs.</p>
          <a
            href="mailto:lmendez@itba.edu.ar?subject=Demo%20Request%20-%20Prent%20AI"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-white font-medium shadow-sm hover:brightness-110"
          >
            Book a demo
          </a>
        </div>
      </section>
    </div>
  );
}
