---
name: sync-api-contract
description: "Synchronize RoomRent frontend API functions, TypeScript types, Zod schemas, React Query hooks, BFF routes, and error handling with the NestJS Swagger/OpenAPI contract and current backend DTOs. Use when Codex adds or changes an endpoint, request field, response shape, enum, authentication requirement, pagination contract, upload flow, or generated API types across client/ and server/."
---

# Synchronize the API contract

Treat the running backend contract and backend source as authoritative. Keep generated types, handwritten domain models, runtime schemas, and UI behavior consistent.

## Locate the contract

1. Read `client/AGENTS.md` and `server/AGENTS.md` for cross-application work.
2. Inspect the relevant backend controller, DTO, Swagger decorators, service return value, Prisma selection, and exception behavior.
3. Inspect the matching frontend files:
   - `src/features/<feature>/api.ts`
   - `src/features/<feature>/schemas.ts`
   - `src/features/<feature>/hooks.ts`
   - BFF route handlers under `src/app/api/`
   - constants and enum labels under `src/lib/`
4. Confirm the actual HTTP method, path, authentication, request body/query, status code, nullable fields, response shape, and error cases.

Do not infer a response solely from Prisma models. Service selections and transformations define what the API returns.

## OpenAPI workflow

The NestJS app exposes Swagger UI at `/docs` and normally exposes JSON at `/docs-json`.

- Start the backend only when required and safe.
- Generate types into the established generated-types path if the project has one.
- If generation is not configured, do not silently invent a permanent command or dependency. Add the setup only when requested or required by the feature.
- Treat generated files as read-only outputs. Fix controller/DTO Swagger metadata or generator configuration rather than hand-editing generated definitions.
- Review the diff after regeneration; unrelated large changes often indicate stale or incomplete Swagger metadata.

An example one-off command, when the backend is running locally, is:

```powershell
pnpm dlx openapi-typescript http://localhost:3000/docs-json -o src/types/api.d.ts
```

Check `package.json` and existing conventions before using it.

## Map the contract to frontend layers

### API functions

- Keep transport code in `api.ts`.
- Use `apiRequest` for Client Component calls through `/api/proxy`.
- Use dedicated `/api/auth/*` handlers for routes that set or clear cookies.
- Use `serverFetch` only for public server-side reads.
- Serialize only fields accepted by the backend.
- Preserve correct HTTP verbs, including `PUT` for full replacement semantics.

### Runtime validation

- Use Zod where untrusted runtime data enters forms or where a response needs defensive validation.
- Mirror backend constraints for immediate UX but keep backend validation authoritative.
- Distinguish nullable, optional, and omitted fields.
- Preserve numeric coercion behavior for HTML inputs.
- Keep enums synchronized with backend values and centralize Vietnamese labels separately.

### React Query

- Update query keys when resource identity changes.
- Invalidate every cache affected by a mutation.
- Do not write a partial mutation response into a cache that promises a fuller shape.
- Keep server-prefetch and client-hook parameters normalized identically.

## Authentication and errors

- Confirm whether an endpoint is public, bearer-authenticated, role-protected, or refresh-cookie-authenticated.
- Keep bearer attachment inside the BFF proxy for browser-originated authenticated calls.
- Forward refresh cookies as backend `Cookie` headers for refresh and logout.
- Handle the shared error shape:

```ts
interface BackendError {
  statusCode: number;
  message: string | string[];
  timestamp: string;
}
```

- Map validation arrays to fields when possible.
- Translate developer-facing backend messages into Vietnamese user-facing copy.
- Handle 401, 403, 404, 409, 422 or 429 according to the feature instead of collapsing all failures into a generic toast.

## Pagination, search, and dates

- Keep `page`, `pageSize`, filters, sort values, and response pagination fields aligned.
- Normalize URL state once before both server prefetch and client query-key construction.
- Keep UI-only URL parameters out of backend requests.
- Treat timestamps as serialized strings at the HTTP boundary.
- Preserve integer VND amounts and `[longitude, latitude]` map ordering.

## Contract change checklist

1. Update backend DTOs, Swagger metadata, service response, and tests.
2. Regenerate types if generation is configured.
3. Update frontend API types and runtime schemas.
4. Update BFF forwarding behavior if method, cookies, or auth changed.
5. Update query keys, hooks, invalidation, and UI state handling.
6. Search for the old endpoint, field, enum value, and response shape across both applications.
7. Run backend and frontend checks proportionally.

Never hide a contract mismatch with `any`, unchecked casts, non-null assertions, or duplicate ad hoc interfaces.
