# Tauri v2 Desktop Packaging Readiness Assessment

- **Target:** Desktop packaging via Tauri v2 for macOS, Windows and Linux.
- **Assessment Date:** 2026-08-02
- **Status:** Assessment only; no native desktop implementation is claimed by this document.

## Architectural Position

SQLite remains the intended local-first persistence option for a desktop deployment. The authenticated cloud web deployment uses PostgreSQL and is documented separately in ADR-002.

This distinction is important: Tauri readiness does not mean that the current web production deployment uses SQLite.

## Compatibility Matrix

| Area | Status | Notes |
|---|---|---|
| React Components | Ready | Compatible with client-side hydration |
| Prisma | Conditional | SQLite is suitable for the local desktop architecture; cloud PostgreSQL is a separate deployment mode |
| Routing | Review required | Deep linking and routing must be verified during packaging |
| File Upload | Review required | Native OS dialog integration may be required |
| Notifications | Review required | Native notification integration may be required |

## Future Native Packaging Work

1. Initialize the Tauri project when desktop packaging is explicitly authorized.
2. Add and verify the required Tauri APIs/plugins.
3. Define the desktop database lifecycle and backup/export behavior.
4. Run platform-specific packaging and acceptance tests.

No released native desktop package should be inferred from this readiness assessment.
