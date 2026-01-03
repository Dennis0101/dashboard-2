export async function healthRoutes(app) {
    app.get("/health", { config: { public: true } }, async () => ({ ok: true }));
}
