import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { getPublicData } from "@/lib/public-data";

export default async function GalleryPage() {
  const { content } = await getPublicData();

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-wide text-center uppercase font-[var(--font-anton)]">
          {content.galleryPageTitle}
        </h1>
        <p className="text-white/70 max-w-2xl text-center">
          {content.galleryEmptyMessage}
        </p>
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
