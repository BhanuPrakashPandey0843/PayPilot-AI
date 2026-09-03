"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { X } from "lucide-react";
import { useCommerceChat } from "@/hooks/useCommerceChat";
import { useCheckout } from "@/hooks/useCheckout";
import { useSession } from "@/hooks/useSession";
import { roleHasPermission } from "@/lib/permissions";
import type { AgentCatalogProduct, ProductMatch } from "@/lib/api/commerce";
import { CommerceHero } from "./CommerceHero";
import { ChatWorkspace } from "./ChatWorkspace";
import { ContextPanel } from "./ContextPanel";

export function CommerceAssistant() {
  const { session } = useSession();
  const chat = useCommerceChat();
  const checkout = useCheckout();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
  const [mobileContextOpen, setMobileContextOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-commerce-hero]", { y: -16, opacity: 0, duration: 0.45 })
        .from("[data-commerce-chat]", { y: 16, opacity: 0, duration: 0.45 }, "-=0.2")
        .from("[data-commerce-context]", { x: 16, opacity: 0, duration: 0.4 }, "-=0.3");
    }, rootRef);

    return () => ctx.revert();
  }, []);

  function productToTarget(product: AgentCatalogProduct | ProductMatch) {
    return { id: product.id, name: product.name };
  }

  async function handleCheckout() {
    if (!selectedCustomerId) return;
    const result = await checkout.startCheckout(chat.sessionId, selectedCustomerId);
    if (result.ok) {
      chat.clearCartLocally();
      chat.appendAssistantMessage({
        text: `Payment confirmed for ${selectedCustomerName ?? "your customer"} 🎉 Order ${result.orderId?.slice(0, 8)} is now paid. Anything else I can help with?`,
      });
    } else if (checkout.status === "cancelled") {
      chat.appendAssistantMessage({
        text: "Checkout was closed before completing payment — your cart is still saved, so you can try again anytime.",
      });
    } else if (checkout.error) {
      chat.appendAssistantMessage({
        text: `Checkout couldn't be completed: ${checkout.error}`,
        error: true,
      });
    }
    checkout.reset();
  }

  const canCheckout = roleHasPermission(session?.role, "ai.execute");
  const checkoutDisabledReason = !canCheckout
    ? "Your role doesn't have permission to run checkout (requires ai.execute)."
    : !selectedCustomerId
      ? "Select a customer in the AI Context panel to enable checkout."
      : undefined;
  const isCheckingOut = checkout.status === "creating" || checkout.status === "awaiting_payment" || checkout.status === "verifying";

  return (
    <div ref={rootRef} className="flex h-[calc(100vh-5rem)] flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
      <div data-commerce-hero>
        <CommerceHero
          organizationName={session?.organization.name ?? "your workspace"}
          cartCount={chat.cartCount}
          hasActiveConversation={chat.messages.length > 0}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[68%_32%]">
        <div data-commerce-chat className="min-h-0">
          <ChatWorkspace
            messages={chat.messages}
            isSending={chat.isSending}
            onSend={chat.send}
            onReset={chat.reset}
            onAddToCart={(p) => chat.addToCart(productToTarget(p))}
            onViewDetails={(p) => chat.viewDetails(productToTarget(p))}
            onCompare={(products) => chat.compare(products.map(productToTarget))}
            onCheckout={handleCheckout}
            checkoutDisabledReason={checkoutDisabledReason}
            isCheckingOut={isCheckingOut}
            onOpenContextPanel={() => setMobileContextOpen(true)}
          />
        </div>

        <div data-commerce-context className="hidden min-h-0 lg:block">
          <ContextPanel
            sessionId={chat.sessionId}
            cart={chat.cart}
            lastIntent={chat.lastIntent}
            version={chat.messages.length}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={(id, name) => {
              setSelectedCustomerId(id);
              setSelectedCustomerName(name);
            }}
            onClearMemory={chat.reset}
            onRequestOrderPreview={chat.requestOrderPreview}
            role={session?.role}
          />
        </div>
      </div>

      {/* Mobile context panel — bottom sheet */}
      {mobileContextOpen && (
        <div className="fixed inset-0 z-40 flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileContextOpen(false)} />
          <div className="relative z-10 max-h-[80vh] w-full overflow-hidden rounded-t-3xl border-t border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-white">AI Context</p>
              <button
                type="button"
                onClick={() => setMobileContextOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(80vh-3rem)] overflow-y-auto">
              <ContextPanel
                sessionId={chat.sessionId}
                cart={chat.cart}
                lastIntent={chat.lastIntent}
                version={chat.messages.length}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={(id, name) => {
                  setSelectedCustomerId(id);
                  setSelectedCustomerName(name);
                }}
                onClearMemory={chat.reset}
                onRequestOrderPreview={chat.requestOrderPreview}
                role={session?.role}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
