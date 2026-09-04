"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { X, Loader2, Package, Plus } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { createProduct, updateProduct, majorToMinor, minorToMajor, type Product, type ProductInput } from "@/lib/api/products";
import {
  validateProductName,
  validateProductSlug,
  validateProductDescription,
  validateProductCategory,
  validateProductTag,
  validateProductTags,
  validateProductPrice,
  validateProductCurrency,
  validateProductInventory,
  validateProductImageUrl,
  slugifyPreview,
} from "@/lib/validation/productValidation";

interface ProductFormModalProps {
  mode: "create" | "edit";
  product?: Product;
  onClose: () => void;
  /** Called once the backend confirms the create/update. Parent
   * refetches the list and shows success feedback — this modal never
   * assumes success before the response comes back. */
  onSaved: (product: Product, mode: "create" | "edit") => void;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  tagDraft: string;
  price: string;
  currency: string;
  inventoryQuantity: string;
  imageUrl: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof Omit<FormState, "tagDraft">, string>>;

function initialState(product?: Product): FormState {
  if (!product) {
    return {
      name: "",
      slug: "",
      description: "",
      category: "",
      tags: [],
      tagDraft: "",
      price: "",
      currency: "INR",
      inventoryQuantity: "0",
      imageUrl: "",
      isActive: true,
    };
  }
  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    category: product.category ?? "",
    tags: product.tags,
    tagDraft: "",
    price: String(minorToMajor(product.price)),
    currency: product.currency,
    inventoryQuantity: String(product.inventoryQuantity),
    imageUrl: product.imageUrl ?? "",
    isActive: product.isActive,
  };
}

/** Maps a 422's Zod-flatten() details ({ fieldErrors: { field: string[] } })
 * onto this form's field names — they're identical to the backend schema
 * keys (createProductBodySchema), so no translation table is needed. */
function mapBackendFieldErrors(details: unknown): FieldErrors {
  const flat = details as { fieldErrors?: Record<string, string[]> } | undefined;
  if (!flat?.fieldErrors) return {};
  const out: FieldErrors = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (messages && messages.length > 0) {
      out[key as keyof FieldErrors] = messages[0];
    }
  }
  return out;
}

const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

/**
 * Shared create/edit form — fields match createProductBodySchema /
 * updateProductBodySchema (products.schemas.ts) exactly, nothing
 * invented. Price is entered in major units (e.g. 499.00) for a normal
 * merchant UX and converted to the integer minor units the backend
 * expects via majorToMinor(), in the one place that conversion happens.
 */
export function ProductFormModal({ mode, product, onClose, onSaved }: ProductFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(product));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (fieldErrors[key as keyof FieldErrors]) {
      setFieldErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function addTag() {
    const trimmed = form.tagDraft.trim();
    if (!trimmed) return;
    const err = validateProductTag(trimmed);
    if (err) {
      setFieldErrors((e) => ({ ...e, tags: err }));
      return;
    }
    if (form.tags.includes(trimmed)) {
      set("tagDraft", "");
      return;
    }
    setForm((f) => ({ ...f, tags: [...f.tags, trimmed], tagDraft: "" }));
    setFieldErrors((e) => ({ ...e, tags: undefined }));
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function runClientValidation(): FieldErrors {
    const errors: FieldErrors = {};
    const name = validateProductName(form.name);
    if (name) errors.name = name;
    const slug = validateProductSlug(form.slug);
    if (slug) errors.slug = slug;
    const description = validateProductDescription(form.description);
    if (description) errors.description = description;
    const category = validateProductCategory(form.category);
    if (category) errors.category = category;
    const tags = validateProductTags(form.tags);
    if (tags) errors.tags = tags;
    const price = validateProductPrice(form.price);
    if (price) errors.price = price;
    const currency = validateProductCurrency(form.currency);
    if (currency) errors.currency = currency;
    const inventoryQuantity = validateProductInventory(form.inventoryQuantity);
    if (inventoryQuantity) errors.inventoryQuantity = inventoryQuantity;
    const imageUrl = validateProductImageUrl(form.imageUrl);
    if (imageUrl) errors.imageUrl = imageUrl;
    return errors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors = runClientValidation();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const body: ProductInput = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      tags: form.tags,
      price: majorToMinor(Number(form.price)),
      currency: form.currency.trim().toUpperCase(),
      inventoryQuantity: Number(form.inventoryQuantity),
      imageUrl: form.imageUrl.trim() || undefined,
      isActive: form.isActive,
    };

    setIsSaving(true);
    try {
      const saved = mode === "create" ? await createProduct(body) : await updateProduct(product!.id, body);
      onSaved(saved, mode);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setFieldErrors(mapBackendFieldErrors(err.details));
        setFormError(err.message);
      } else if (err instanceof ApiError && err.status === 409) {
        setFieldErrors((e) => ({ ...e, slug: err.message }));
        setFormError(err.message);
      } else {
        setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const slugPlaceholder = form.slug ? undefined : slugifyPreview(form.name || "product");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
      <div className="glass-panel relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-amber)]/12">
            <Package className="h-5 w-5 text-[var(--accent-amber)]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {mode === "create" ? "Add product" : "Edit product"}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-white">
              {mode === "create" ? "New catalog product" : product?.name}
            </h2>
          </div>
        </div>

        {formError && (
          <div className="mt-4 rounded-2xl border border-[var(--accent-rose)]/25 bg-[var(--accent-rose)]/[0.06] p-3 text-sm text-[var(--accent-rose)]">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Product name" error={fieldErrors.name} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              disabled={isSaving}
              placeholder="e.g. Wireless Mouse"
              className={inputClass(!!fieldErrors.name)}
            />
          </Field>

          <Field
            label="Slug"
            error={fieldErrors.slug}
            hint="Lowercase, hyphen-separated. Leave blank to auto-generate from the name."
          >
            <input
              type="text"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              disabled={isSaving}
              placeholder={slugPlaceholder}
              className={inputClass(!!fieldErrors.slug)}
            />
          </Field>

          <Field label="Description" error={fieldErrors.description}>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              disabled={isSaving}
              rows={3}
              placeholder="What buyers (and PayPilot's AI agent) should know about this product…"
              className={inputClass(!!fieldErrors.description)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={fieldErrors.category}>
              <input
                type="text"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                disabled={isSaving}
                placeholder="e.g. Electronics"
                className={inputClass(!!fieldErrors.category)}
              />
            </Field>

            <Field label="Image URL" error={fieldErrors.imageUrl}>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                disabled={isSaving}
                placeholder="https://…"
                className={inputClass(!!fieldErrors.imageUrl)}
              />
            </Field>
          </div>

          <Field label="Tags" error={fieldErrors.tags} hint="Up to 20 — used for search and AI cross-sell matching.">
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-2 focus-within:border-[var(--border-strong)]">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-1 text-xs text-zinc-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    disabled={isSaving}
                    className="text-zinc-500 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={form.tagDraft}
                onChange={(e) => set("tagDraft", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={isSaving}
                placeholder={form.tags.length === 0 ? "Type a tag and press Enter…" : "Add another…"}
                className="min-w-[100px] flex-1 bg-transparent px-1 py-0.5 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price" error={fieldErrors.price} required>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                disabled={isSaving}
                placeholder="499.00"
                className={inputClass(!!fieldErrors.price)}
              />
            </Field>

            <Field label="Currency" error={fieldErrors.currency} required>
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                disabled={isSaving}
                className={inputClass(!!fieldErrors.currency)}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-[var(--background-elevated)]">
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Inventory qty" error={fieldErrors.inventoryQuantity} required>
              <input
                type="number"
                min={0}
                step="1"
                value={form.inventoryQuantity}
                onChange={(e) => set("inventoryQuantity", e.target.value)}
                disabled={isSaving}
                className={inputClass(!!fieldErrors.inventoryQuantity)}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Active</p>
              <p className="text-xs text-zinc-500">
                Inactive products are hidden from checkout and the AI buyer catalog.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => set("isActive", !form.isActive)}
              disabled={isSaving}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                form.isActive ? "bg-[var(--accent-emerald)]" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  form.isActive ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "create" ? (
                <Plus className="h-4 w-4" />
              ) : null}
              {isSaving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-xl border bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none disabled:opacity-50 ${
    hasError ? "border-[var(--accent-rose)]/60 focus:border-[var(--accent-rose)]" : "border-[var(--border-subtle)] focus:border-[var(--border-strong)]"
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
        <span className="mt-1 block text-xs text-[var(--accent-rose)]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-zinc-600">{hint}</span>
      ) : null}
    </label>
  );
}
