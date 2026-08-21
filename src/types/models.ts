import { Url } from "next/dist/shared/lib/router/router";

export type Role = "user" | "admin";

export interface UserProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  institution: string;
  phone: string;
  address: string;
  classLevel: string;
  fbLink: string;
  clubPartnerCode?: string;
  profilePicId?: string;
  role: Role;
  referredByCode?: string;
}

export interface Segment {
  $id: string;
  name: string;
  description: string;
  image: string;
  rules: string;
  formSchema: string;
  isTeamEvent?: boolean;
  teamMemberLimit?: number;
  isPaid?: boolean;
  fee?: number;
  bkashNumber?: string;
}

export type RegistrationStatus = "pending" | "approved" | "disapproved";

export interface Registration {
  $id: string;
  userId: string;
  segmentId: string;
  teamName?: string;
  teamMemberUserIds?: string[];
  paymentTransactionId?: string;
  status?: RegistrationStatus;
  additionalFormData: string;
}

export type AmbassadorStatus = "pending" | "approved" | "rejected";

export interface Ambassador {
  $id: string;
  userId: string;
  caCode: string;
  points: number;
  referralsCount: number;
  status: AmbassadorStatus;
}

export interface ClubPartner {
   $id: string;
 userId: string;
  clubName?: string;
  clubCode: string;
   points: number;
   referralsCount: number;
   status: "pending" | "approved" | "rejected";
   createdAt: string;
   updatedAt: string;
 }

export interface Package {
  $id: string;
  name: string;
  price: number;
  benefits: string;
  bkashNumber?: string;
  includedSegmentIds?: string[];
}

export interface Purchase {
  $id: string;
  userId: string;
  packageId: string;
  paymentTransactionId?: string;
  status?: "pending" | "approved" | "rejected";   
}


export interface ContentBlock {
  $id: string;
  key: string;
  value: string;
}
export interface ContactMessage {
  $id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
}