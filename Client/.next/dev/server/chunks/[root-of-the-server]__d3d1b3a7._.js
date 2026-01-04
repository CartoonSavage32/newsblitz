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
"[project]/lib/supabase/migrate.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMigrationInstructions",
    ()=>getMigrationInstructions,
    "tableExists",
    ()=>tableExists
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/client.ts [app-route] (ecmascript)");
;
async function tableExists() {
    try {
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('news_articles').select('id').limit(1);
        // If no error, table exists
        if (!error) return true;
        // Check if error is specifically about table not existing
        if (error.message?.includes('does not exist') || error.message?.includes('schema cache') || error.message?.includes('relation') && error.message?.includes('does not exist')) {
            return false;
        }
        // Other errors might mean table exists but has issues
        // Re-throw to surface the actual problem
        throw error;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('does not exist') || errorMessage.includes('schema cache') || errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
            return false;
        }
        throw error;
    }
}
function getMigrationInstructions() {
    return `
╔══════════════════════════════════════════════════════════════╗
║  MIGRATION REQUIRED                                          ║
╚══════════════════════════════════════════════════════════════╝

The news_articles table does not exist. Please run the migration:

OPTION 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste the SQL from: Client/supabase/migrations/001_create_news_articles.sql
5. Click "Run"

OPTION 2: Supabase CLI
  npx supabase db push

OPTION 3: Run migration script
  npm run migrate

After running the migration, restart your Next.js server.
  `;
}
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/app/api/migrate/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$migrate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/migrate.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
;
;
async function GET() {
    try {
        const exists = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$migrate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tableExists"])();
        if (exists) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                migrated: true,
                message: '✓ Table news_articles exists'
            });
        }
        // Table doesn't exist - provide migration SQL
        try {
            const migrationPath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(process.cwd(), 'supabase', 'migrations', '001_create_news_articles.sql');
            const migrationSQL = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["readFileSync"])(migrationPath, 'utf-8');
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                migrated: false,
                message: 'Table news_articles does not exist',
                instructions: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$migrate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getMigrationInstructions"])(),
                sql: migrationSQL,
                steps: [
                    '1. Go to https://supabase.com/dashboard',
                    '2. Select your project',
                    '3. Go to SQL Editor',
                    '4. Copy the SQL from the "sql" field above',
                    '5. Paste and run it'
                ]
            });
        } catch  {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                migrated: false,
                message: 'Table news_articles does not exist',
                instructions: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$migrate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getMigrationInstructions"])(),
                error: 'Could not read migration file'
            });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check migration status';
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: errorMessage,
            instructions: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$migrate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getMigrationInstructions"])()
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d3d1b3a7._.js.map