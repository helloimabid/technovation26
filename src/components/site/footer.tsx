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
      <div className="relative my-4 flex min-h-24 w-full max-w-7xl items-center justify-center px-2 opacity-40 sm:min-h-32 md:min-h-40">
        <h1 className="max-w-full text-center font-[var(--font-anton)] text-[clamp(2.5rem,11vw,10rem)] uppercase leading-[0.82] tracking-[-0.03em] text-white">
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
