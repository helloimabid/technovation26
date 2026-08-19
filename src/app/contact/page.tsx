// app/contact/page.tsx
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { FaqSection } from "@/components/site/faq-section";
import { ContactForm } from "@/components/site/contact-form";
import { getPublicData } from "@/lib/public-data";

export default async function ContactPage() {
  const { content } = await getPublicData();

  return (
    <>
      <Navbar />
      <div className="pt-24 bg-white text-[#333]">
        <div className="py-16 px-6 md:px-12 text-center border-b border-black/5 relative z-10 max-w-4xl mx-auto">
          <h1 className="max-w-full break-words text-[clamp(2.25rem,6vw,3rem)] leading-tight font-bold mb-6 text-[#06061b] uppercase font-[var(--font-anton)] tracking-wider">
            {content.contactPageTitle}
          </h1>
          <p className="text-black/70 text-lg leading-relaxed mb-8">
            {content.contactPageDescription}
          </p>
          <ContactForm />
        </div>
        <FaqSection items={content.faq} title={content.faqTitle} description={content.faqDescription} />
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