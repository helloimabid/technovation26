import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { getPublicData } from "@/lib/public-data";
import { ScheduleTimeline } from "@/components/site/schedule-timeline";

export default async function SchedulePage() {
  const { content } = await getPublicData();
  const schedule = content.schedule || [];

  return (
    <>
      <Navbar />
      <div className="pt-24 bg-[#06061b] min-h-screen text-white pb-32">
        <div className="py-12 md:py-24 px-6 md:px-12 max-w-5xl mx-auto relative z-10 w-full">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 uppercase font-[var(--font-anton)] tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              {content.schedulePageTitle}
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-medium">
              {content.schedulePageDescription}
            </p>
          </div>

          <ScheduleTimeline schedule={schedule} emptyMessage={content.scheduleEmptyMessage} />
        </div>
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