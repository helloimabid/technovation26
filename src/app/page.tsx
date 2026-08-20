import { Footer } from "@/components/site/footer";
import { FaqSection } from "@/components/site/faq-section";
import { Hero } from "@/components/site/hero";
import { AboutSection } from "@/components/site/about-section";
import { Navbar } from "@/components/site/navbar";
import { ReferralCapture } from "@/components/site/referral-capture";
import { SegmentsGrid } from "@/components/site/segments-grid";
import { getPublicData } from "@/lib/public-data";
import { SponsorsMarquee } from "@/components/site/sponsors-marquee";

export default async function Home() {
  const { segments, content } = await getPublicData();

  return (
    <div className="bg-[#06061b] text-white overflow-x-hidden">
      <ReferralCapture />
      <Navbar />
      <Hero title={content.heroTitle} dateLabel={content.heroDateLabel} targetDate={content.eventDateISO} ctaLabel={content.heroPrimaryCtaLabel} />
      <AboutSection highlightTitle={content.aboutHighlightTitle} highlightBody={content.aboutHighlightBody} teaserCaption={content.aboutTeaserCaption} />
      <SegmentsGrid segments={segments} ctaLabel={content.eventsCtaLabel} />
      {/* <SponsorsMarquee sponsors={content.sponsors} /> */}
      <FaqSection items={content.faq} title={content.faqTitle} description={content.faqDescription} />
      <Footer
        brandText={content.footerBrandText}
        communityLabel={content.footerCommunityLabel}
        communityUrl={content.footerCommunityUrl}
        policyLabel={content.footerPolicyLabel}
        policyUrl={content.footerPolicyUrl}
      />
    </div>
  );
}
