"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, Loader2, Plus, User, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { createCustomer, updateCustomer, type Customer, type CustomerInput, type CustomerStatus } from "@/lib/api/customers";
import {
  validateCustomerName,
  validateCustomerEmail,
  validateCustomerPhone,
  validateCustomerExternalId,
} from "@/lib/validation/customerValidation";
import { CUSTOMER_STATUS_OPTIONS } from "./customerMeta";

interface CustomerFormModalProps {
  mode: "create" | "edit";
  customer?: Customer;
  onClose: () => void;
  /** Called with the real created/updated row once the backend confirms
   * it — never called optimistically, so the list is only ever
   * refreshed with data the server actually returned. */
  onSaved: (customer: Customer) => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  externalCustomerId: string;
  status: CustomerStatus;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function initialState(customer?: Customer): FormState {
  if (!customer) {
    return { name: "", email: "", phone: "", externalCustomerId: "", status: "active" };
  }
  return {
    name: customer.name,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    externalCustomerId: customer.externalCustomerId ?? "",
    status: customer.status,
  };
}

/** Backend field-error keys (customers.schemas.ts's Zod field names)
 * this form has a matching input for. Anything else surfaces in the
 * general error banner instead of being silently dropped. */
const KNOWN_FIELDS: (keyof FieldErrors)[] = ["name", "email", "phone", "externalCustomerId"];

export function CustomerFormModal({ mode, customer, onClose, onSaved }: CustomerFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(customer));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function runClientValidation(): FieldErrors {
    const next: FieldErrors = {
      name: validateCustomerName(form.name) ?? undefined,
      email: validateCustomerEmail(form.email) ?? undefined,
      phone: validateCustomerPhone(form.phone) ?? undefined,
      externalCustomerId: validateCustomerExternalId(form.externalCustomerId) ?? undefined,
    };
    Object.keys(next).forEach((k) => {
      if (!next[k as keyof FieldErrors]) delete next[k as keyof FieldErrors];
    });
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    const clientErrors = runClientValidation();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    const body: CustomerInput = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      externalCustomerId: form.externalCustomerId.trim() || undefined,
      status: form.status,
    };

    setIsSaving(true);
    try {
      const saved = mode === "create" ? await createCustomer(body) : await updateCustomer(customer!.id, body);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
        const fieldErrors = details?.fieldErrors ?? {};
        const mapped: FieldErrors = {};
        for (const field of KNOWN_FIELDS) {
          const msgs = fieldErrors[field as string];
          if (msgs && msgs.length > 0) mapped[field] = msgs[0];
        }
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof ApiError && err.status === 409) {
        setErrors((e) => ({ ...e, externalCustomerId: err.message }));
      } else {
        setGeneralError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/12">
              <User className="h-5 w-5 text-[var(--accent-cyan)]" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {mode === "create" ? "New customer" : "Edit customer"}
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-white">
                {mode === "create" ? "Add a customer" : customer?.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {generalError && (
              <div className="flex items-start gap-2 rounded-2xl border border-[var(--accent-rose)]/25 bg-[var(--accent-rose)]/[0.06] p-3 text-xs text-[var(--accent-rose)]">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {generalError}
              </div>
            )}

            <Field label="Customer name" error={errors.name} required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Priya Sharma"
                className={inputClass(Boolean(errors.name))}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@example.com"
                  className={inputClass(Boolean(errors.email))}
                />
              </Field>

              <Field label="Phone" error={errors.phone}>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inputClass(Boolean(errors.phone))}
                />
              </Field>
            </div>

            <Field
              label="External customer ID"
              error={errors.externalCustomerId}
              hint="Optional — an ID from an external system, if this customer was imported."
            >
              <input
                type="text"
                value={form.externalCustomerId}
                onChange={(e) => set("externalCustomerId", e.target.value)}
                placeholder="e.g. cus_1a2b3c"
                className={inputClass(Boolean(errors.externalCustomerId))}
              />
            </Field>

            <Field label="Status" required>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as CustomerStatus)}
                className={inputClass(false)}
              >
                {CUSTOMER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[var(--background-elevated)]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "create" ? (
                <Plus className="h-4 w-4" />
              ) : null}
              {isSaving ? "Saving…" : mode === "create" ? "Create customer" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-xl border bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)] ${
    hasError ? "border-[var(--accent-rose)]/60" : "border-[var(--border-subtle)]"
  }`;
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-zinc-400">
        {label}
        {required && <span className="text-[var(--accent-rose)]">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] text-[var(--accent-rose)]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-zinc-500">{hint}</span>
      ) : null}
    </label>
  );
}
