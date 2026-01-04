"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
            <Card className="w-full max-w-md mx-4">
                <CardContent className="pt-6">
                    <div className="flex mb-4 gap-2">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                        <h1 className="text-2xl font-bold text-foreground">404 Page Not Found</h1>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground mb-6">
                        The page you're looking for doesn't exist or has been moved.
                    </p>

                    <Button asChild>
                        <Link href="/news">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to News
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

