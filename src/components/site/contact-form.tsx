// components/site/contact-form.tsx
"use client";

import { useActionState } from "react";
import { submitContactForm, ContactFormState } from "@/app/actions/contact";

const initialState: ContactFormState = { success: false };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  );

  return (
    <form action={formAction} className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg text-left">
      {state.success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          Your message has been sent successfully!
        </div>
      )}
      {state.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {state.error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
        {state.fieldErrors?.name && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
        {state.fieldErrors?.email && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject (optional)
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
        {state.fieldErrors?.subject && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.subject}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
        {state.fieldErrors?.message && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#6972fd] text-white py-2 px-4 rounded-md hover:bg-[#5b63ea] transition-colors disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}