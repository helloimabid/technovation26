// app/actions/contact.ts
'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createContactMessage } from "@/lib/db";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export type ContactFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const rawData = {
    name: formData.get("name")?.toString() || "",
    email: formData.get("email")?.toString() || "",
    subject: formData.get("subject")?.toString() || "",
    message: formData.get("message")?.toString() || "",
  };

  const result = contactSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { success: false, fieldErrors };
  }

  try {
    await createContactMessage(result.data);
    revalidatePath("/contact");
    return { success: true };
  } catch (error) {
    console.error("Failed to save contact message:", error);
    return { success: false, error: "Something went wrong. Please try again later." };
  }
}