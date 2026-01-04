"use client";

import { GA4Tracker } from "@/components/shared/GA4Tracker";
import { DesktopNavbar } from "@/components/layout/navbar";
import { useMediaQuery } from "@/hooks/useMobile";
import "@/styles/globals.css";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Script from "next/script";
import { useEffect, useState } from "react";

// Note: Metadata is exported from layout-seo.tsx (server component pattern)
// This layout is a client component due to hooks usage

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");
    const ga4Id = process.env.NEXT_PUBLIC_GA4_ID || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

    // Initialize theme on mount
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('newsblitz-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = stored === 'dark' || (!stored && prefersDark);

        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    return (
        <html lang="en">
            <head>
                {/* GA4 Analytics - Scripts loaded via Next.js Script component */}
                {ga4Id && (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
                            strategy="afterInteractive"
                        />
                        <Script id="ga4-init" strategy="afterInteractive">
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${ga4Id}', {
                                    page_path: window.location.pathname,
                                });
                            `}
                        </Script>
                    </>
                )}
            </head>
            <body>
                <QueryClientProvider client={queryClient}>
                    <GA4Tracker />
                    <div className="h-screen flex flex-col">
                        {mounted && !isMobile && <DesktopNavbar />}
                        <main className="flex-grow overflow-auto">{children}</main>
                    </div>
                </QueryClientProvider>
            </body>
        </html>
    );
}

