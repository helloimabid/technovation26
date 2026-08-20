import { Query } from "node-appwrite";
import { unstable_noStore as noStore } from "next/cache";
import { getAdminClient } from "@/lib/appwrite/server";
import { env } from "@/lib/env";
import { ContentBlock, Package, Segment } from "@/types/models";

const defaultFaq = [
  {
    question: "Who can participate?",
    answer:
      "Any school or college student with a valid ID card can participate. Specific segments may have category divisions.",
  },
  {
    question: "Can I participate in multiple events?",
    answer: "Yes, if schedules do not overlap.",
  },
  {
    question: "Will equipment be provided?",
    answer: "Participants should bring their own device and project equipment.",
  },
];

const defaultSchedule = [
  {
    day: "Day 01 - Friday",
    events: [
      { time: "08:00 AM", title: "Gates Open & Registration", location: "Main Campus" },
      { time: "10:00 AM", title: "Opening Ceremony", location: "Auditorium" },
      { time: "11:30 AM", title: "Hackathon Kickoff", location: "Hall C" },
    ]
  },
  {
    day: "Day 02 - Saturday",
    events: [
      { time: "09:00 AM", title: "Robo Riot Starts", location: "Ground" },
      { time: "12:00 PM", title: "Gaming Tournament", location: "Hall A" },
      { time: "04:00 PM", title: "Prize Giving Ceremony", location: "Auditorium" },
    ]
  }
];

function safeParseJson<T>(value: string | undefined, fallbackValue: T): T {
  if (!value) return fallbackValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallbackValue;
  }
}

function parseIncludedSegmentIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
      return [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function getPublicData() {
  noStore();

  const fallback = {
    segments: [] as Segment[],
    packages: [] as Package[],
    content: {
      heroTitle: "TECHNOVATION'26",
      heroDateLabel: "18 - 20 SEPTEMBER 2026",
      eventDateISO: "2026-09-18T10:00:00+06:00",
      heroPrimaryCtaLabel: "Register Now",
      aboutPageTitle: "About Tecnovation'26",
      aboutPageDescription: "Discover the mission, community spirit, and innovation journey behind Tecnovation'26.",
      aboutHighlightTitle: "TECNOVATION'26 DHAKA",
      aboutHighlightBody:
        "will inspire you to think bigger about the way you code and design. Join us for never-before-seen tech showcases, intense competitions, sessions from industry leaders, and a community of innovators.",
      aboutTeaserCaption: "Teaser Coming Soon",
      eventsPageTitle: "All Events",
      eventsPageDescription:
        "Discover a variety of segments designed to test your coding skills, robotic innovation, and strategic gameplay. Find your arena and dominate.",
      eventsCtaLabel: "REGISTER NOW",
      schedulePageTitle: "Event Schedule",
      schedulePageDescription:
        "Explore the hour-by-hour action below to ensure you don't miss your favorite segments. Schedule is subject to minor changes.",
      scheduleEmptyMessage: "Schedule details will be announced soon.",
      galleryPageTitle: "Gallery",
      galleryPageDescription: "Photos and memories from our past events will be displayed here soon.",
      galleryEmptyMessage: "Photos and memories from our past events will be displayed here soon.",
      contactPageTitle: "Contact & FAQ",
      contactPageDescription:
        "Have questions about the event, registration, or your stay? We're here to help. Check out the FAQ below, or reach out to us on our social platforms.",
      contactCtaLabel: "Message Us on FB",
      contactCtaUrl: "https://www.facebook.com/JosephiteITClub",
      faqTitle: "Got questions?",
      faqDescription: "Find answers to common questions about the event, registration, and participation rules.",
      footerBrandText: "TECNOVATION'26",
      footerCommunityLabel: "Josephite IT Club",
      footerCommunityUrl: "https://www.facebook.com/JosephiteITClub",
      footerPolicyLabel: "Privacy Policy",
      footerPolicyUrl: "/privacy-policy",
      faq: defaultFaq,
      schedule: defaultSchedule,
    },
  };
// inside getPublicData, after fetching blocks
// const sponsorsRaw = contentMap.sponsors;
// let sponsors: { name: string; logoFileId: string; url?: string }[] = [];
// if (sponsorsRaw) {
//   try {
//     const parsed = JSON.parse(sponsorsRaw);
//     if (Array.isArray(parsed)) sponsors = parsed;
//   } catch {}
// }

// return {
//   // ... existing
//   sponsors,
// };
  if (!env.endpoint || !env.projectId || !env.apiKey || !env.databaseId) {
    return fallback;
  }

  try {
    const { databases } = getAdminClient();

    const [segments, blocks, packages] = await Promise.all([
      databases.listDocuments(env.databaseId, env.collections.segments, [Query.limit(9)]),
      databases.listDocuments(env.databaseId, env.collections.contentBlocks, [Query.limit(100)]),
      databases
        .listDocuments(env.databaseId, env.collections.packages, [Query.limit(30)])
        .catch(() => ({ documents: [] })),
    ]);

    const contentMap = (blocks.documents as unknown as ContentBlock[]).reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return {
      segments: JSON.parse(JSON.stringify(segments.documents)) as Segment[],
      packages: (JSON.parse(JSON.stringify(packages.documents)) as Array<Record<string, unknown>>).map((item) => ({
        ...(item as unknown as Package),
        includedSegmentIds: parseIncludedSegmentIds(item.includedSegmentIds),
      })),
      content: {
        heroTitle: contentMap.heroTitle ?? fallback.content.heroTitle,
        heroDateLabel: contentMap.heroDateLabel ?? fallback.content.heroDateLabel,
        eventDateISO: contentMap.eventDateISO ?? fallback.content.eventDateISO,
        heroPrimaryCtaLabel: contentMap.heroPrimaryCtaLabel ?? fallback.content.heroPrimaryCtaLabel,
        aboutPageTitle: contentMap.aboutPageTitle ?? fallback.content.aboutPageTitle,
        aboutPageDescription: contentMap.aboutPageDescription ?? fallback.content.aboutPageDescription,
        aboutHighlightTitle: contentMap.aboutHighlightTitle ?? fallback.content.aboutHighlightTitle,
        aboutHighlightBody: contentMap.aboutHighlightBody ?? fallback.content.aboutHighlightBody,
        aboutTeaserCaption: contentMap.aboutTeaserCaption ?? fallback.content.aboutTeaserCaption,
        eventsPageTitle: contentMap.eventsPageTitle ?? fallback.content.eventsPageTitle,
        eventsPageDescription: contentMap.eventsPageDescription ?? fallback.content.eventsPageDescription,
        eventsCtaLabel: contentMap.eventsCtaLabel ?? fallback.content.eventsCtaLabel,
        schedulePageTitle: contentMap.schedulePageTitle ?? fallback.content.schedulePageTitle,
        schedulePageDescription: contentMap.schedulePageDescription ?? fallback.content.schedulePageDescription,
        scheduleEmptyMessage: contentMap.scheduleEmptyMessage ?? fallback.content.scheduleEmptyMessage,
        galleryPageTitle: contentMap.galleryPageTitle ?? fallback.content.galleryPageTitle,
        galleryPageDescription: contentMap.galleryPageDescription ?? fallback.content.galleryPageDescription,
        galleryEmptyMessage: contentMap.galleryEmptyMessage ?? fallback.content.galleryEmptyMessage,
        contactPageTitle: contentMap.contactPageTitle ?? fallback.content.contactPageTitle,
        contactPageDescription: contentMap.contactPageDescription ?? fallback.content.contactPageDescription,
        contactCtaLabel: contentMap.contactCtaLabel ?? fallback.content.contactCtaLabel,
        contactCtaUrl: contentMap.contactCtaUrl ?? fallback.content.contactCtaUrl,
        faqTitle: contentMap.faqTitle ?? fallback.content.faqTitle,
        faqDescription: contentMap.faqDescription ?? fallback.content.faqDescription,
        footerBrandText: contentMap.footerBrandText ?? fallback.content.footerBrandText,
        footerCommunityLabel: contentMap.footerCommunityLabel ?? fallback.content.footerCommunityLabel,
        footerCommunityUrl: contentMap.footerCommunityUrl ?? fallback.content.footerCommunityUrl,
        footerPolicyLabel: contentMap.footerPolicyLabel ?? fallback.content.footerPolicyLabel,
        footerPolicyUrl: contentMap.footerPolicyUrl ?? fallback.content.footerPolicyUrl,
        faq: safeParseJson(contentMap.faq, fallback.content.faq),
        schedule: safeParseJson(contentMap.schedule, fallback.content.schedule),
      },
    };
  } catch {
    return fallback;
  }
}

export async function getSegmentById(id: string): Promise<Segment | null> {
  // Segment details can be edited from admin; avoid serving stale cached pages.
  noStore();

  if (!env.endpoint || !env.projectId || !env.apiKey || !env.databaseId) {
    return null;
  }

  try {
    const { databases } = getAdminClient();
    const doc = await databases.getDocument(env.databaseId, env.collections.segments, id);
    return JSON.parse(JSON.stringify(doc)) as Segment;
  } catch {
    return null;
  }
}
