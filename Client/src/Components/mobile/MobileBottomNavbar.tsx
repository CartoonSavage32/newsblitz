import { Heart, Home, MessageSquare, Newspaper } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

interface MobileBottomNavbarProps {
    disableDonate?: boolean;
}

export function MobileBottomNavbar({ disableDonate = true }: MobileBottomNavbarProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60">
            <div className="flex h-16 items-center justify-around px-4">
                <Link href="/">
                    <Button variant="ghost" className="flex flex-col items-center gap-1">
                        <Home className="h-5 w-5" />
                        <span className="text-xs">Home</span>
                    </Button>
                </Link>
                <Link href="/news">
                    <Button variant="ghost" className="flex flex-col items-center gap-1">
                        <Newspaper className="h-5 w-5" />
                        <span className="text-xs">News</span>
                    </Button>
                </Link>
                <Link href="/feedback">
                    <Button variant="ghost" className="flex flex-col items-center gap-1">
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-xs">Feedback</span>
                    </Button>
                </Link>
                {/* Donation feature disabled for MVP */}
                {disableDonate ? (
                    <Button 
                        variant="ghost" 
                        className="flex flex-col items-center gap-1 opacity-50 cursor-not-allowed" 
                        disabled
                    >
                        <Heart className="h-5 w-5" />
                        <span className="text-xs">Donate</span>
                    </Button>
                ) : (
                    <Link href="/donate">
                        <Button variant="ghost" className="flex flex-col items-center gap-1">
                            <Heart className="h-5 w-5" />
                            <span className="text-xs">Donate</span>
                        </Button>
                    </Link>
                )}
            </div>
        </nav>
    );
}
