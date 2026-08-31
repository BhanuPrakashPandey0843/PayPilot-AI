"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";

import { SuccessState } from "@/components/states/SuccessState";
import { cn } from "@/lib/utils";

const INQUIRY_TYPES = [
  { value: "general", label: "General inquiry" },
  { value: "business", label: "Business inquiry" },
  { value: "merchant-support", label: "Merchant support" },
  { value: "partnership", label: "Partnership" },
] as const;

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  organization: z.string().trim().max(255).optional(),
  inquiryType: z.enum(["general", "business", "merchant-support", "partnership"]),
  message: z.string().trim().min(10, "Tell us a little more (min 10 characters)").max(2000),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const inputClasses =
  "w-full rounded-[12px] border border-black/[0.1] bg-white px-3.5 py-2.5 text-[13.5px] text-[#111217] outline-none transition-colors placeholder:text-[#A9AAB1] focus:border-[#111217]/30 focus-visible:ring-2 focus-visible:ring-[#111217]/15";

/**
 * Contact form shell only — validated client-side with react-hook-form +
 * Zod, but intentionally NOT wired to a backend endpoint yet. `onSubmit`
 * just simulates a request so the loading/success states can be reviewed;
 * swap in a real submit handler once the contact API contract exists.
 */
export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { inquiryType: "general" },
  });

  async function onSubmit() {
    // NOTE: no backend contract for /contact exists yet — this is a UI
    // shell only. Replace with a real submit once the API is defined.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSubmitted(true);
    reset();
  }

  if (submitted) {
    return (
      <SuccessState
        title="Message sent"
        description="Thanks for reaching out — we'll get back to you shortly."
        action={
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-1 text-[13px] font-medium text-[#111217] underline underline-offset-4 hover:opacity-80"
          >
            Send another message
          </button>
        }
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)] sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-[12.5px] font-medium text-[#111217]">
            Name
          </label>
          <input id="name" type="text" autoComplete="name" className={cn(inputClasses, "mt-1.5")} {...register("name")} />
          {errors.name && (
            <p className="mt-1 text-[11.5px] text-[#E14F55]">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="text-[12.5px] font-medium text-[#111217]">
            Email
          </label>
          <input id="email" type="email" autoComplete="email" className={cn(inputClasses, "mt-1.5")} {...register("email")} />
          {errors.email && (
            <p className="mt-1 text-[11.5px] text-[#E14F55]">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="organization" className="text-[12.5px] font-medium text-[#111217]">
          Organization <span className="text-[#A9AAB1]">(optional)</span>
        </label>
        <input
          id="organization"
          type="text"
          autoComplete="organization"
          className={cn(inputClasses, "mt-1.5")}
          {...register("organization")}
        />
      </div>

      <div className="mt-4">
        <span className="text-[12.5px] font-medium text-[#111217]">What's this about?</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {INQUIRY_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex cursor-pointer items-center justify-center rounded-[10px] border border-black/[0.1] px-2 py-2 text-center text-[11.5px] font-medium text-[#5F6067] transition-colors has-[:checked]:border-[#111217] has-[:checked]:bg-[#111217] has-[:checked]:text-white"
            >
              <input type="radio" value={type.value} className="sr-only" {...register("inquiryType")} />
              {type.label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="message" className="text-[12.5px] font-medium text-[#111217]">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          className={cn(inputClasses, "mt-1.5 resize-none")}
          {...register("message")}
        />
        {errors.message && (
          <p className="mt-1 text-[11.5px] text-[#E14F55]">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[13px] bg-[#111217] px-6 text-sm font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#111217]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <Send className="h-4 w-4" strokeWidth={2} />
        )}
        Send message
      </button>
    </form>
  );
}
