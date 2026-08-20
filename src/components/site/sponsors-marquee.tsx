"use client";

import { env } from "@/lib/env";

type Sponsor = {
  name: string;
  logoFileId: string;
  url?: string;
};

const getFilePreviewUrl = (fileId: string) => {
  // Use Appwrite's preview endpoint; adjust if using custom domain
  return `${env.endpoint}/storage/buckets/${env.sponsorsBucketId}/files/${fileId}/preview?project=${env.projectId}`;
};

export function SponsorsMarquee({ sponsors }: { sponsors: Sponsor[] }) {
  if (!sponsors || sponsors.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...sponsors, ...sponsors];

  return (
    <div className="w-full overflow-hidden bg-[#0E0B16] py-8 border-y border-white/5">
      <div className="relative flex overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {items.map((sponsor, index) => (
            <a
              key={`${sponsor.logoFileId}-${index}`}
              href={sponsor.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-8 inline-block h-16 w-auto grayscale hover:grayscale-0 transition-all duration-300"
            >
              <img
                src={getFilePreviewUrl(sponsor.logoFileId)}
                alt={sponsor.name}
                className="h-full w-auto object-contain"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}