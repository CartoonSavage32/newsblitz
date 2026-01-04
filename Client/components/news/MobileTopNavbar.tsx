import { Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface MobileTopNavbarProps {
    onFilterOpen: () => void;
}

export function MobileTopNavbar({ onFilterOpen }: MobileTopNavbarProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60">
            <div className="flex h-14 items-center px-4 justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <div className="relative h-8 w-8">
                        <div className="absolute transform rotate-45 bg-primary w-6 h-6" />
                        <div className="absolute transform -rotate-45 bg-yellow-500 w-6 h-6 left-2" />
                    </div>
                    <span className="font-bold text-xl">NewsBlitz</span>
                </Link>
                {/* Right side buttons */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {/* Filter trigger */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onFilterOpen}
                        className="relative"
                    >
                        <>
                            <Filter className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                        </>
                    </Button>
                </div>
            </div>
        </header>
    );
}

