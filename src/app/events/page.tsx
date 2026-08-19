import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { SegmentsGrid } from "@/components/site/segments-grid";
import { PackagesSection } from "@/components/site/packages-section";
import { getPublicData } from "@/lib/public-data";

export default async function EventsPage() {
  const { segments, packages, content } = await getPublicData();

  return (
    <>
      <Navbar />
      <div className="pt-24 bg-[#06061b]">
        <div className="py-24 px-6 md:px-12 text-center border-b border-white/5 relative z-10">
          <h1 className="max-w-full break-words text-[clamp(2.25rem,6vw,3rem)] leading-tight font-bold text-white mb-6 uppercase font-[var(--font-anton)] tracking-wider">
            {content.eventsPageTitle}
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
            {content.eventsPageDescription}
          </p>
        </div>
        <PackagesSection packages={packages} segments={segments} />
        <SegmentsGrid segments={segments} ctaLabel={content.eventsCtaLabel} />
      </div>
      <Footer
        brandText={content.footerBrandText}
        communityLabel={content.footerCommunityLabel}
        communityUrl={content.footerCommunityUrl}
        policyLabel={content.footerPolicyLabel}
        policyUrl={content.footerPolicyUrl}
      />
    </>
  );
}
