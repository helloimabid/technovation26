import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <h1 className="text-4xl font-bold text-white mb-8 tracking-wide uppercase font-[var(--font-anton)]">
            Privacy Policy
          </h1>
          <div className="prose prose-invert prose-lg text-white/80">
            <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <h2>Information We Collect</h2>
            <p>
              When you register for Tecnovation&apos;26, we collect standard registration details such as your name, email, institution, and phone number to manage your event participation.
            </p>
            <h2>How We Use Your Information</h2>
            <p>
              Your information is strictly used for event communications, generating passes, and coordinating segment details. We do not sell your personal data to third parties.
            </p>
            <h2>Data Security</h2>
            <p>
              We deploy standard security measures to ensure your data is safe and protected against unauthorized access.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
