import { format } from "date-fns"
import useEmblaCarousel from "embla-carousel-react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import type { NewsArticle } from "../../shared/schema"
import { generateArticleSlug } from "../../lib/utils/slug"
import { trackGA4Event } from "../../lib/analytics"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

interface NewsCarouselProps {
  articles: NewsArticle[]
}

export function NewsCarousel({ articles }: NewsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
  }, [emblaApi, onSelect])

  // Reset carousel to first article when articles change (category filter change)
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.scrollTo(0)
    setSelectedIndex(0)
  }, [articles, emblaApi])

  return (
    <div className="relative shrink-0 w-full h-full overflow-hidden">
      {/* Embla main viewport */}
      <div className="w-full h-full" ref={emblaRef}>
        {/* Slides container: horizontal scrolling */}
        <div className="flex h-full">
          {articles.map((article) => (
            <div
              key={article.id}
              className="relative flex-[0_0_100%] w-full h-full overflow-hidden"
            >
              {/* Blurred background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${article.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(12px)",
                }}
              />
              <div className="absolute inset-0 bg-black/30" />

              {/* Foreground: split into left (image) & right (glass overlay) */}
              <div className="relative z-10 flex w-full h-full">
                {/* Left half: the news image */}
                <div className="w-1/2 h-full overflow-hidden">
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Right half: glass overlay for text, scroll if needed */}
                <div
                  className="
                    w-1/2 h-full p-6
                    flex flex-col
                    bg-black/20
                    backdrop-blur-md
                    border-l border-white/20
                    text-white
                    rounded-r-xl
                    overflow-y-auto
                  "
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-primary text-primary-foreground">
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(article.date), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      Published by: {article.publisher ?? "Unknown"}
                    </span>
                  </div>

                  {/* Title and description */}
                  <h2 className="text-2xl md:text-4xl font-bold mb-2">
                    <Link 
                      href={`/news/${generateArticleSlug(article.title, article.id)}`}
                      className="hover:underline"
                    >
                      {article.title}
                    </Link>
                  </h2>
                  <p className="text-sm md:text-base leading-relaxed">
                    {article.description}
                  </p>

                  {/* Read more button pinned at bottom, with extra bottom padding */}
                  <div className="mt-auto flex justify-start gap-2 mb-4 pt-7">
                    <Button
                      variant="secondary"
                      className="bg-primary text-primary-foreground font-bold"
                      asChild
                    >
                      <Link href={`/news/${generateArticleSlug(article.title, article.id)}`}>
                        View Article
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="text-primary-foreground border-primary-foreground/20"
                      onClick={() => {
                        // Track "Read more" click event for GA4
                        trackGA4Event('read_more_click', {
                          article_id: article.id,
                          article_title: article.title,
                          source_url: article.readMoreUrl,
                        });
                        const newWindow = window.open(article.readMoreUrl, "_blank", "noopener,noreferrer")
                        if (newWindow) newWindow.opener = null
                      }}
                    >
                      Source
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons with extra spacing from edges */}
      <div className="absolute bottom-6 right-6 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-white/50 hover:bg-white/70 backdrop-blur-xs"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-white/50 hover:bg-white/70 backdrop-blur-xs"
          onClick={scrollNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* News Count Indicator - placed below the carousel if you prefer */}
      <div className="mt-6 text-center text-white text-sm font-bold">
        {`News ${selectedIndex + 1} of ${articles.length}`}
      </div>
    </div>
  )
}
