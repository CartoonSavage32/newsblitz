import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function DesktopNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo Section */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative h-8 w-8">
            <div className="absolute transform rotate-45 bg-primary w-6 h-6" />
            <div className="absolute transform -rotate-45 bg-yellow-500 w-6 h-6 left-2" />
          </div>
          <span className="font-bold text-xl">NewsBlitz</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link
            href="/news"
            className="text-foreground/60 hover:text-foreground transition-colors duration-200"
          >
            <span>News</span>
          </Link>
          <Link
            href="/feedback"
            className="text-foreground/60 hover:text-foreground transition-colors duration-200"
          >
            <span>Feedback</span>
          </Link>
          <ThemeToggle />
          {/* Donation feature disabled for MVP */}
          {/* <Link href="/donate" className="inline-flex">
            <Button variant="secondary" className="bg-primary text-primary-foreground btn-hover" disabled={true}>
              Donate
            </Button>
          </Link> */}
        </nav>
      </div>
    </header>
  );
}

