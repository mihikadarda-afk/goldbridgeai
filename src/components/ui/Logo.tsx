import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 shadow-gold ring-1 ring-gold-400/40 dark:bg-navy-800">
        {/* Bridge mark in metallic gold */}
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="gb-gold" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#e6c977" />
              <stop offset="0.5" stopColor="#c08d29" />
              <stop offset="1" stopColor="#e0bd5c" />
            </linearGradient>
          </defs>
          <path
            d="M3 22c4-9 8-9 13 0M16 22c4-9 8-9 13 0"
            stroke="url(#gb-gold)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M3 22h26" stroke="url(#gb-gold)" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 22v4M16 13v13M24 22v4" stroke="url(#gb-gold)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      {showWord && (
        <span className="text-lg font-semibold tracking-tight text-navy-900 dark:text-white">
          Gold<span className="text-gold-metallic">Bridge</span>
          <span className="ml-1 align-super text-[10px] font-medium tracking-widest text-charcoal-400">
            AI
          </span>
        </span>
      )}
    </span>
  );
}
