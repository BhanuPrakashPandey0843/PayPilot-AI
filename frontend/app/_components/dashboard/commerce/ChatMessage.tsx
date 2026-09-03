"use client";

import { Sparkles, User, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { CommerceChatMessage } from "@/hooks/useCommerceChat";
import type { AgentCatalogProduct, ProductMatch } from "@/lib/api/commerce";
import { ProductGrid } from "./ProductGrid";
import { ComparisonWidget } from "./ComparisonWidget";
import { RecommendationRow } from "./RecommendationRow";
import { OrderPreviewWidget } from "./OrderPreviewWidget";

const INTENT_LABELS: Record<string, string> = {
  PRODUCT_SEARCH: "Product search",
  PRODUCT_COMPARE: "Comparing products",
  PRODUCT_DETAILS: "Product details",
  ADD_TO_CART: "Added to cart",
  REMOVE_FROM_CART: "Removed from cart",
  ORDER_PREVIEW: "Order preview",
  UNKNOWN: "Unclear intent",
};

interface ChatMessageProps {
  message: CommerceChatMessage;
  onAddToCart: (product: AgentCatalogProduct | ProductMatch) => void;
  onViewDetails: (product: AgentCatalogProduct | ProductMatch) => void;
  onCompare: (products: (AgentCatalogProduct | ProductMatch)[]) => void;
  onCheckout: () => void;
  checkoutDisabledReason?: string;
  isCheckingOut?: boolean;
}

export function ChatMessage({
  message,
  onAddToCart,
  onViewDetails,
  onCompare,
  onCheckout,
  checkoutDisabledReason,
  isCheckingOut,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="flex items-start justify-end gap-3"
      >
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2.5 text-sm text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.4)]">
          {message.text}
        </div>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300">
          <User className="h-4 w-4" />
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="flex items-start gap-3">
      <span
        className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          message.error ? "bg-[var(--accent-rose)]/12" : "bg-gradient-to-br from-[var(--accent-violet)]/30 to-[var(--accent-cyan)]/30"
        }`}
      >
        {message.error ? <AlertTriangle className="h-4 w-4 text-[var(--accent-rose)]" /> : <Sparkles className="h-4 w-4 text-[var(--accent-cyan)]" />}
        {!message.error && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[var(--background)] bg-[var(--accent-emerald)]" />
        )}
      </span>

      <div className="max-w-[85%] flex-1 space-y-3">
        <div
          className={`rounded-2xl rounded-tl-sm border px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            message.error
              ? "border-[var(--accent-rose)]/30 bg-[var(--accent-rose)]/[0.06] text-[var(--accent-rose)]"
              : "border-[var(--border-subtle)] bg-white/[0.03] text-zinc-100"
          }`}
        >
          {message.text}
        </div>

        {!message.error && message.intent && (
          <p className="inline-flex items-center gap-1.5 px-1 text-[11px] text-zinc-600">
            <Zap className="h-3 w-3" /> {INTENT_LABELS[message.intent] ?? message.intent}
          </p>
        )}

        {message.products && message.products.length > 0 && (
          <ProductGrid products={message.products} onAddToCart={onAddToCart} onViewDetails={onViewDetails} onCompare={onCompare} />
        )}

        {message.recommendations && message.recommendations.length > 0 && (
          <RecommendationRow recommendations={message.recommendations} onAddToCart={onAddToCart} />
        )}

        {message.comparison && message.comparison.length >= 2 && (
          <ComparisonWidget products={message.comparison} onAddToCart={onAddToCart} />
        )}

        {message.intent === "ORDER_PREVIEW" && (
          <OrderPreviewWidget
            preview={message.orderPreview}
            policy={message.policy}
            onCheckout={onCheckout}
            checkoutDisabledReason={checkoutDisabledReason}
            isCheckingOut={isCheckingOut}
          />
        )}
      </div>
    </motion.div>
  );
}
