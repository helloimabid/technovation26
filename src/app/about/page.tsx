import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AboutSection } from "@/components/site/about-section";
import { getPublicData } from "@/lib/public-data";

export default async function AboutPage() {
  const { content } = await getPublicData();

  return (
    <>
      <Navbar />
      <div className="pt-24 bg-[#6972fd]">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-12 md:py-16 text-white">
          <h1 className="max-w-full break-words text-[clamp(2.25rem,6vw,3rem)] leading-tight font-bold uppercase font-[var(--font-anton)] tracking-wider mb-5">
            {content.aboutPageTitle}
          </h1>
          <p className="text-white/85 text-lg leading-relaxed">{content.aboutPageDescription}</p>
        </div>
        <AboutSection highlightTitle={content.aboutHighlightTitle} highlightBody={content.aboutHighlightBody} teaserCaption={content.aboutTeaserCaption} />
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
