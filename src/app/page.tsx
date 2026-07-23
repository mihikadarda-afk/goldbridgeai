import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Inspiration } from "@/components/landing/Inspiration";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, SectionHeading } from "@/components/ui/Section";

const dimensions = [
  {
    title: "Strategic Fit",
    body: "Market positioning, cross-sell potential, and long-term thesis alignment.",
  },
  {
    title: "Financial Fit",
    body: "Revenue quality, EBITDA comparability, and combined margin structure.",
  },
  {
    title: "Operational Fit",
    body: "Systems, processes, and integration complexity across functions.",
  },
  {
    title: "Cultural Fit",
    body: "Leadership style, retention risk, and organizational alignment.",
  },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />

        {/* Four dimensions */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading
            eyebrow="What We Measure"
            title="Compatibility across four dimensions."
            lead="A merger only works when companies fit on every axis — not just the balance sheet."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dimensions.map((d, i) => (
              <Reveal key={d.title} delay={i * 0.08}>
                <div className="surface h-full rounded-2xl p-6">
                  <div className="mb-4 h-9 w-9 rounded-lg bg-gold-metallic/90" />
                  <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                    {d.title}
                  </h3>
                  <p className="mt-2 text-sm text-charcoal-500 dark:text-navy-300">{d.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <Inspiration />
        <HowItWorks />

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-8 py-16 text-center shadow-card dark:border dark:border-white/10">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl"
                aria-hidden
              />
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Evaluate your next acquisition with confidence.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-navy-200">
                Upload both companies&rsquo; data and receive an executive compatibility report in
                minutes.
              </p>
              <div className="mt-8 flex justify-center">
                <ButtonLink href="/analyze" variant="gold" size="lg">
                  Start Analysis
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
