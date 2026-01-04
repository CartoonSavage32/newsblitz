import { FILTERS } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";


interface MobileFilterSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

export function MobileFilterSheet({
    isOpen,
    onOpenChange,
    selectedCategory,
    onSelectCategory,
}: MobileFilterSheetProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <div />
            </SheetTrigger>
            <SheetContent side="top" className="w-full max-w-none pt-20">
                <SheetHeader>
                    <SheetTitle>Filter News</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-2 pt-4">
                    {FILTERS.map((cat: string) => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            className={cn(
                                "h-12",
                                selectedCategory === cat && "bg-primary hover:bg-primary/90 text-primary-foreground"
                            )}
                            onClick={() => {
                                onSelectCategory(cat);
                                onOpenChange(false);
                            }}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}

