export function Footer({
  brandText,
  communityLabel,
  communityUrl,
  policyLabel,
  policyUrl,
}: {
  brandText?: string;
  communityLabel?: string;
  communityUrl?: string;
  policyLabel?: string;
  policyUrl?: string;
}) {
  return (
    <footer className="relative z-10 flex flex-col items-center justify-between overflow-hidden border-t border-white/10 bg-[#06061b] px-4 py-16 sm:px-6 md:px-12 md:py-24">
      <div className="relative my-4 flex h-20 w-full max-w-7xl items-center justify-center opacity-40 sm:h-28 md:h-40">
        <h1 className="max-w-full px-2 text-center font-[var(--font-anton)] text-[clamp(2.5rem,12vw,10rem)] uppercase leading-[0.8] tracking-tight text-white">
          {brandText ?? "TECNOVATION'26"}
        </h1>
      </div>

      <div className="relative z-10 mt-4 flex w-full max-w-7xl flex-col items-center justify-center gap-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center">
          <a href={communityUrl ?? "https://www.facebook.com/JosephiteITClub"} target="_blank" rel="noopener noreferrer" className="font-[var(--font-inter)] text-sm text-white font-medium tracking-wide hover:underline decoration-white/30 underline-offset-4">{communityLabel ?? "Josephite IT Club"}</a>
          <a href={policyUrl ?? "/privacy-policy"} className="font-[var(--font-inter)] text-sm text-white font-medium tracking-wide hover:underline decoration-white/30 underline-offset-4">{policyLabel ?? "Privacy Policy"}</a>
        </div>

        
      </div>
    </footer>
  );
}
