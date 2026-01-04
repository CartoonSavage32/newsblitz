"use client";

// Donation feature disabled for MVP - CreditCard import commented out
// import { CreditCard, MessageSquare, Newspaper } from "lucide-react";
import { MessageSquare, Newspaper } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section with Quote */}
        <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-12 md:py-24">
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

          <div className="max-w-3xl mx-auto space-y-12">
            {/* Quote */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tighter">
                Stay <span className="text-yellow-500">Informed</span>, Stay{" "}
                <span className="text-yellow-500">Engaged</span> With <br className="hidden sm:inline" />
                Instant News <span className="text-yellow-500">Summaries</span>
              </h1>
              <p className="text-muted-foreground max-w-[700px] mx-auto">
                Get the news that matters to you, delivered in a format that respects your time and attention.
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Button
                asChild
                size="lg"
                className="h-auto py-6 bg-gradient-to-r from-yellow-400 to-amber-500 hover:opacity-90 text-black"
              >
                <Link href="/news" className="flex flex-col items-center gap-2">
                  <Newspaper className="h-6 w-6" />
                  <div className="flex flex-col">
                    <span className="font-bold">News</span>
                    <span className="text-xs font-normal">Browse latest articles</span>
                  </div>
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="h-auto py-6 border-2">
                <Link href="/feedback" className="flex flex-col items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  <div className="flex flex-col">
                    <span className="font-bold">Feedback</span>
                    <span className="text-xs font-normal">Help us improve</span>
                  </div>
                </Link>
              </Button>

              {/* Donation feature disabled for MVP */}
              {/* <Button asChild size="lg" variant="secondary" className="h-auto py-6">
                <Link href="/donate" className="flex flex-col items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  <div className="flex flex-col">
                    <span className="font-bold">Donate</span>
                    <span className="text-xs font-normal">Support our mission</span>
                  </div>
                </Link>
              </Button> */}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">Curated Headlines</h3>
                <p className="text-sm text-muted-foreground">
                  tay up to date with the most important and trending stories—all in one place.
                </p>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">Concise Summaries</h3>
                <p className="text-sm text-muted-foreground">
                  Get the key points without wading through lengthy articles.
                </p>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">Distraction-Free Reading</h3>
                <p className="text-sm text-muted-foreground">Enjoy a clean, minimal interface that puts the news front and center, letting you focus on what matters most.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
          <p className="text-sm text-muted-foreground">© 2025 NewsBlitz. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/feedback" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

