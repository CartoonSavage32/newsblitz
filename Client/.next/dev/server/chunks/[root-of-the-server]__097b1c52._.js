module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/supabase/client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
// Get Supabase URL and key from environment
// Use server-side env vars if available, fallback to public vars
const supabaseUrl = process.env.SUPABASE_URL || ("TURBOPACK compile-time value", "https://nwetibipeflvpgqgilrn.supabase.co") || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZXRpYmlwZWZsdnBncWdpbHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzUxNjgsImV4cCI6MjA4MjkxMTE2OH0.z2i7RzCI_edHcZcgmSY3TMvJtOJOwBGlUY_35hXo50U") || '';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false
    }
});
}),
"[project]/lib/news/repository.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAllNews",
    ()=>getAllNews,
    "getNewsByCategory",
    ()=>getNewsByCategory,
    "insertNewsArticle",
    ()=>insertNewsArticle,
    "insertNewsArticles",
    ()=>insertNewsArticles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/client.ts [app-route] (ecmascript)");
;
async function getAllNews() {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('news_articles').select('*').order('published_at', {
        ascending: false,
        nullsFirst: false
    });
    if (error) {
        throw new Error(`Failed to fetch news: ${error.message}`);
    }
    // Transform DBArticle to NewsArticle format expected by frontend
    return (data || []).map(transformDBArticleToNewsArticle);
}
/**
 * Transform database article to frontend NewsArticle format
 */ function transformDBArticleToNewsArticle(dbArticle) {
    // Default image if none provided (same as used in Python ingestion)
    const defaultImage = "https://media.istockphoto.com/id/1409309637/vector/breaking-news-label-banner-isolated-vector-design.jpg?s=2048x2048&w=is&k=20&c=rHMT7lr46TFGxQqLQHvSGD6r79AIeTVng-KYA6J1XKM=";
    // Ensure imageUrl is never empty - use default if null, undefined, or empty string
    const imageUrl = dbArticle.image_url && dbArticle.image_url.trim() !== '' ? dbArticle.image_url : defaultImage;
    // Use published_at if available, otherwise fallback to created_at (never use today's date)
    const articleDate = dbArticle.published_at ? new Date(dbArticle.published_at) : new Date(dbArticle.created_at);
    // Ensure readMoreUrl is never empty
    const readMoreUrl = dbArticle.article_url && dbArticle.article_url.trim() !== '' ? dbArticle.article_url : '#';
    return {
        id: dbArticle.id,
        news_number: dbArticle.raw?.news_number || 0,
        title: dbArticle.title,
        imageUrl: imageUrl,
        category: dbArticle.category,
        publisher: dbArticle.source,
        description: dbArticle.summary || '',
        date: articleDate,
        readMoreUrl: readMoreUrl
    };
}
async function getNewsByCategory(category) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('news_articles').select('*').eq('category', category).order('published_at', {
        ascending: false,
        nullsFirst: false
    });
    if (error) {
        throw new Error(`Failed to fetch news by category: ${error.message}`);
    }
    return data || [];
}
async function insertNewsArticle(article) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('news_articles').insert(article).select().single();
    if (error) {
        throw new Error(`Failed to insert article: ${error.message}`);
    }
    return data;
}
async function insertNewsArticles(articles) {
    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('news_articles').insert(articles).select();
    if (error) {
        throw new Error(`Failed to insert articles: ${error.message}`);
    }
    return data || [];
}
}),
"[project]/app/api/news/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$news$2f$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/news/repository.ts [app-route] (ecmascript)");
;
;
async function GET() {
    try {
        const news = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$news$2f$repository$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAllNews"])();
        // Transform to match frontend expectations (grouped by category)
        // Frontend expects: { category: Article[] }
        const groupedNews = {};
        for (const article of news){
            const category = article.category || 'All';
            if (!groupedNews[category]) {
                groupedNews[category] = [];
            }
            groupedNews[category].push(article);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(groupedNews);
    } catch (error) {
        console.error('Error fetching news:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch news'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__097b1c52._.js.map