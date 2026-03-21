import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Full Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 chars"),
  confirmPassword: z.string().min(8, "Password must be at least 8 chars"),
  address: z.string().min(1, "Address is required"),
  institution: z.string().min(1, "Institution is required"),
  classLevel: z.string().min(1, "Class is required"),
  phone: z.string().min(1, "Mobile Number is required"),
  fbLink: z.string().url("Must be a valid URL"),
  referralCode: z.string().optional(),
  clubPartnerCode: z.string().optional(),
  terms: z.boolean().refine(val => val === true, "Must accept terms and conditions"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const segmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  image: z.string().url(),
  rules: z.string().min(2),
  formSchema: z.string().default("[]"),
  isTeamEvent: z.boolean().default(false),
  teamMemberLimit: z.coerce.number().int().min(0).default(0),
  isPaid: z.boolean().default(false),
  fee: z.coerce.number().min(0).default(0),
  bkashNumber: z.string().trim().max(30).optional().default(""),
});

export const packageSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().min(0),
  benefits: z.string().min(2),
  bkashNumber: z.string().trim().max(30).optional().default(""),
  includedSegmentIds: z.array(z.string().min(1)).min(1, "Select at least one segment"),
});

export const registrationSchema = z.object({
  segmentId: z.string().min(1),
  teamName: z.string().optional(),
  teamMemberUserIds: z.array(z.string().min(1)).default([]),
  paymentTransactionId: z.string().trim().max(120).optional().default(""),
  status: z.enum(["pending", "approved", "disapproved"]).optional().default("pending"),
  additionalFormData: z.string().default("{}"),
});

export const contentBlockSchema = z.object({
  key: z.string().min(2),
  value: z.string().min(1),
});
