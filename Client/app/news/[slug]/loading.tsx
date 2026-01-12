// Article page loading skeleton
export default function ArticleLoading() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back Button */}
                <div className="mb-6">
                    <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                </div>

                {/* Breadcrumbs */}
                <nav className="mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                        <span className="text-muted-foreground">/</span>
                        <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                        <span className="text-muted-foreground">/</span>
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        <span className="text-muted-foreground">/</span>
                        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                    </div>
                </nav>

                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-6 w-20 bg-primary/20 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-full bg-muted rounded animate-pulse mb-2" />
                    <div className="h-10 w-3/4 bg-muted rounded animate-pulse mb-4" />
                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                </header>

                {/* Image */}
                <div className="mb-8">
                    <div className="w-full h-64 md:h-96 bg-muted rounded-lg animate-pulse" />
                </div>

                {/* Content */}
                <article className="mb-8">
                    <div className="bg-muted/50 p-4 rounded-lg mb-6">
                        <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        <div className="h-4 w-full bg-muted rounded animate-pulse" />
                        <div className="h-4 w-full bg-muted rounded animate-pulse" />
                        <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-full bg-muted rounded animate-pulse" />
                        <div className="h-4 w-4/5 bg-muted rounded animate-pulse" />
                    </div>
                </article>

                {/* Source */}
                <div className="border-t pt-8 mt-8">
                    <div className="bg-muted/30 p-6 rounded-lg">
                        <div className="h-4 w-40 bg-muted rounded animate-pulse mb-4" />
                        <div className="h-3 w-full bg-muted rounded animate-pulse mb-4" />
                        <div className="h-10 w-32 bg-muted rounded animate-pulse mb-4" />
                        <div className="h-3 w-64 bg-muted rounded animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
