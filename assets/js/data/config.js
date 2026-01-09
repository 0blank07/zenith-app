// Check if ENV already exists to prevent "already declared" errors
window.ENV = window.ENV || {
    SUPABASE_URL: 'https://ugszalubwvartwalsejx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3phbHVid3ZhcnR3YWxzZWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTg4MzksImV4cCI6MjA3NDIzNDgzOX0.wHH6DctC6mtNcqZ4VeCdlPHk_Tg9xbfrY90EAUKvI8k'
};

// Proactive LocalStorage Cleanup
// This runs before Supabase or App initialization to prevent JSON parse errors
try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (value === "[object Object]") {
            console.warn(`[Cleanup] Identifying corrupted key for removal: ${key}`);
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[Cleanup] Removed corrupted key: ${key}`);
    });
} catch (e) {
    console.warn("[Cleanup] Error accessing localStorage", e);
}
