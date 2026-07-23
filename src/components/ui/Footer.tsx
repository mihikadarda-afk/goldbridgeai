import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="no-print border-t border-navy-100 bg-navy-50/40 dark:border-white/10 dark:bg-navy-950">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm text-charcoal-500 dark:text-navy-300">
              Bridging Companies. Predicting Success. AI-powered compatibility analysis for
              mergers and acquisitions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol title="Platform" items={[["Start Analysis", "/analyze"], ["Results", "/results"], ["How It Works", "/#how-it-works"]]} />
            <FooterCol title="About" items={[["Inspiration", "/#inspiration"], ["Bernard Goldstein", "https://civichall.org/bernard-goldstein"]]} />
            <FooterCol title="Legal" items={[["Privacy", "#"], ["Terms", "#"], ["Security", "#"]]} />
          </div>
        </div>
        <div className="mt-12 gold-divider" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-charcoal-400 sm:flex-row">
          <p>© {new Date().getFullYear()} GoldBridge AI. For evaluation purposes; not investment, legal, or tax advice.</p>
          <p>Powered by the ma-compatibility-scoring agent.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-navy-900 dark:text-white">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm text-charcoal-500 transition hover:text-gold-600 dark:text-navy-300 dark:hover:text-gold-300"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
