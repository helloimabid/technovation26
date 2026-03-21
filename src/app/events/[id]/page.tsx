import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { SegmentRegistrationButton } from "@/components/site/segment-registration-button";
import { getSegmentById } from "@/lib/public-data";

function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || url.trim() === "") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function SegmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const segment = await getSegmentById(id);
  if (!segment) return notFound();

  const hasImage = isValidImageUrl(segment.image);

  return (
    <div className="min-h-screen bg-[#06061b] text-white flex flex-col relative overflow-hidden">
      {/* Full-page segment image background */}
      {hasImage ? (
        <img
          src={segment.image}
          alt={segment.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-[#06061b]/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#06061b]/40 via-[#06061b]/70 to-[#06061b]" />

      <Navbar />

      {/* Hero Banner */}
      <section className="relative w-full pt-28 mt-24 md:pt-36">
        {/* <div className="relative w-full h-[260px] md:h-[380px] overflow-hidden">
          {hasImage ? (
            <img
                      src={segment.image || "https://placehold.co/600x400/EEE/31343C"}
                      alt={segment.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-in-out"
                    />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#12103a] via-[#0d0a20] to-[#06061b] flex items-center justify-center">
              <span className="text-white/[0.06] text-[12rem] md:text-[18rem] font-bold font-[var(--font-anton)] uppercase select-none leading-none">
                {segment.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06061b] via-[#06061b]/70 to-transparent" />
        </div> */}

        {/* Title overlay */}
        <div className="relative z-10 max-w-5xl mx-auto px-6  md:px-12 -mt-20 md:-mt-28">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs uppercase tracking-[0.2em] font-[var(--font-inter)] font-semibold mb-4 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Events
          </Link>
          <h1 className="font-[var(--font-anton)] text-4xl md:text-6xl lg:text-7xl uppercase tracking-wider leading-[0.95] drop-shadow-xl">
            {segment.name}
          </h1>

          {/* Fee badge */}
          {segment.isPaid && segment.fee != null && segment.fee > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 bg-[#6972fd]/15 border border-[#6972fd]/30 px-5 py-2 rounded-full">
              <span className="text-[#9ea4ff] text-xs uppercase tracking-[0.2em] font-semibold">Fee</span>
              <span className="text-white font-[var(--font-anton)] text-xl tracking-wide">{segment.fee} BDT</span>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 relative z-10 max-w-5xl w-full mx-auto mb-24 px-6 md:px-12 py-12 md:py-16 space-y-12">
        <div className="grid lg:grid-cols-[1fr_340px] gap-10 lg:gap-14 items-start">
          {/* Left column — description & rules */}
          <div className="space-y-10">
            {/* Description */}
            <div>
              <h2 className="text-xs uppercase tracking-[0.25em] text-[#6972fd] font-[var(--font-roboto-mono)] font-semibold mb-4">
                Description
              </h2>
              <div className="text-white/70 leading-relaxed whitespace-pre-line text-[15px]">
                {segment.description}
              </div>
            </div>

            {/* Rules */}
            {segment.rules && segment.rules.trim() !== "" && (
              <div>
                <h2 className="text-xs uppercase tracking-[0.25em] text-[#6972fd] font-[var(--font-roboto-mono)] font-semibold mb-4">
                  Rules &amp; Guidelines
                </h2>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8">
                  <div className="text-white/65 leading-relaxed whitespace-pre-line text-sm">
                    {segment.rules}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column — registration */}
          <aside className="lg:sticky lg:top-28 space-y-5">
            <div className="bg-[#0d0a1a]/80 border border-white/10 rounded-2xl p-6 space-y-5 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white/80 text-center">
                Participate
              </h3>

              {segment.isPaid && segment.fee != null && segment.fee > 0 && (
                <div className="text-center">
                  <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-1">Registration Fee</p>
                  <p className="text-3xl font-[var(--font-anton)] text-[#6972fd] tracking-wide">{segment.fee} BDT</p>
                </div>
              )}

              <SegmentRegistrationButton segment={segment} />
            </div>
          </aside>
        </div>
      </main>

      <div className="relative z-10 opacity-30 ">
        <Footer />
      </div>
    </div>
  );
}
