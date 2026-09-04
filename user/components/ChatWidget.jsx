'use client'
import { useEffect, useState } from "react";
import { Bot, X, ExternalLink, RefreshCcw } from "lucide-react";

// Base URL of the real chatbot app (backend/chatbot — the Rails + React
// conversational commerce widget wired to the live PayPilot API). Run that
// app on its own port (it defaults to 3000, same as this Next.js app, so
// set PORT=3001 in backend/chatbot/.env for local dev) and point this at it.
const CHATBOT_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || "http://localhost:3001";

/**
 * Floating "3D" bot avatar, fixed to the bottom-right of the screen.
 * Click toggles a chat panel that embeds the real chatbot app (built in
 * backend/chatbot) in an iframe, so all the actual conversation, basket and
 * Razorpay checkout logic keeps living in one place.
 *
 * No external image/gif asset is used on purpose — the avatar below is
 * pure CSS/SVG (gradient "shell" + highlight + antenna + blinking eyes),
 * which keeps it dependency- and licensing-free while still reading as a
 * small floating 3D character.
 */
const ChatWidget = () => {
    const [open, setOpen] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [loaded, setLoaded] = useState(false);

    // Prevent background scroll on small screens when the panel is open full-height
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = ""; };
        }
    }, [open]);

    const handleReload = () => {
        setLoaded(false);
        setIframeKey((k) => k + 1);
    };

    return (
        <>
            {/* Chat panel */}
            {open && (
                <div
                    className="fixed z-50 bottom-0 right-0 sm:bottom-24 sm:right-6 w-full sm:w-[380px] h-[85vh] sm:h-[600px] sm:max-h-[calc(100vh-7rem)] bg-white sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-[chatPanelIn_0.25s_ease-out]"
                    role="dialog"
                    aria-label="Chat assistant"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0 size-9 rounded-full bg-white/15 flex items-center justify-center">
                                <Bot size={20} />
                                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-lime-300 border-2 border-green-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold leading-tight truncate">GoCart Assistant</p>
                                <p className="text-[11px] text-green-50/90 leading-tight">Ask, compare, checkout</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={handleReload}
                                title="Restart conversation"
                                aria-label="Restart conversation"
                                className="p-1.5 rounded-full hover:bg-white/15 transition"
                            >
                                <RefreshCcw size={16} />
                            </button>
                            <a
                                href={CHATBOT_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in new tab"
                                aria-label="Open chat in new tab"
                                className="p-1.5 rounded-full hover:bg-white/15 transition"
                            >
                                <ExternalLink size={16} />
                            </a>
                            <button
                                onClick={() => setOpen(false)}
                                title="Close"
                                aria-label="Close chat"
                                className="p-1.5 rounded-full hover:bg-white/15 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="relative flex-1 min-h-0">
                        {!loaded && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
                                <div className="size-8 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
                                <p className="text-xs text-slate-500">Connecting to assistant…</p>
                            </div>
                        )}
                        <iframe
                            key={iframeKey}
                            src={CHATBOT_URL}
                            title="GoCart chat assistant"
                            className="w-full h-full border-0"
                            onLoad={() => setLoaded(true)}
                        />
                    </div>
                </div>
            )}

            {/* Floating launcher */}
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close chat assistant" : "Open chat assistant"}
                aria-expanded={open}
                className="group fixed z-50 bottom-5 right-5 sm:bottom-6 sm:right-6 size-16 outline-none"
            >
                {/* pulsing ring */}
                {!open && (
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-[botPulseRing_2.4s_ease-out_infinite]" />
                )}

                {/* floating 3D-styled bot shell */}
                <span
                    className={`relative flex items-center justify-center size-16 rounded-full shadow-[0_10px_25px_-5px_rgba(22,163,74,0.5)] bg-gradient-to-br from-green-400 via-green-500 to-green-700 border-2 border-white/70 transition-transform duration-200 group-hover:scale-105 group-active:scale-95 ${open ? "" : "animate-[botFloat_3.2s_ease-in-out_infinite]"}`}
                >
                    {/* top-left glossy highlight for a "3D" feel */}
                    <span className="pointer-events-none absolute top-1.5 left-2 w-6 h-4 rounded-full bg-white/35 blur-[3px] rotate-[-20deg]" />

                    {open ? (
                        <X size={26} className="text-white drop-shadow" />
                    ) : (
                        <span className="relative flex flex-col items-center">
                            {/* antenna */}
                            <span className="absolute -top-4 w-0.5 h-3 bg-white/80 rounded-full" />
                            <span className="absolute -top-5 size-1.5 rounded-full bg-lime-300 shadow-[0_0_6px_2px_rgba(190,242,100,0.8)]" />
                            <Bot size={30} className="text-white drop-shadow" strokeWidth={2} />
                        </span>
                    )}

                    {/* unread/notification dot */}
                    {!open && (
                        <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-red-500 border-2 border-white" />
                    )}
                </span>
            </button>
        </>
    );
};

export default ChatWidget;
