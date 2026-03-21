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
    <footer className="bg-[#06061b] py-24 md:py-32 px-6 md:px-12 flex flex-col items-center justify-between border-t border-white/10 relative overflow-hidden z-10">
      <div className="w-full flex flex-col items-center justify-center opacity-40 select-none pointer-events-none relative h-[15vw] mb-8 mt-4">
        <h1 className="font-[var(--font-anton)] text-[12vw] leading-[0.8] tracking-tight text-white uppercase text-center whitespace-nowrap absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {brandText ?? "TECNOVATION'26"}
        </h1>
      </div>

      <div className="w-full max-w-7xl flex flex-col items-center justify-center gap-6 relative z-10 mt-4">
        <div className="flex items-center justify-center gap-6">
          <a href={communityUrl ?? "https://www.facebook.com/JosephiteITClub"} target="_blank" rel="noopener noreferrer" className="font-[var(--font-inter)] text-sm text-white font-medium tracking-wide hover:underline decoration-white/30 underline-offset-4">{communityLabel ?? "Josephite IT Club"}</a>
          <a href={policyUrl ?? "/privacy-policy"} className="font-[var(--font-inter)] text-sm text-white font-medium tracking-wide hover:underline decoration-white/30 underline-offset-4">{policyLabel ?? "Privacy Policy"}</a>
        </div>

        
      </div>
    </footer>
  );
}
