---
name: build-admin-moderation-flow
description: "Build or modify RoomRent administrator workflows for approving, rejecting, hiding, restoring, and verifying listings; reviewing reports; banning or unbanning users; moderation history; dashboard data; audit trails; and approval notifications. Use whenever Codex changes server/src/modules/admin, RoomModeration, moderation statuses, reports, administrator permissions, or post-approval side effects."
---

# Build an admin moderation flow

Preserve explicit state transitions, administrator-only access, auditability, and safe side effects.

## Inspect current policy

Read:

- `server/AGENTS.md`
- `prisma/schema.prisma`
- `src/modules/admin/`
- `src/modules/rooms/`
- `src/modules/reports/`
- `src/modules/notifications/`
- Relevant guards, DTOs, and tests

Use the actual `RoomStatus`, `ReportStatus`, `ModerationAction`, and `Role` enums. Do not invent an action without updating the schema and creating a new migration.

## Secure the controller

- Apply `JwtAuthGuard` and `RolesGuard`.
- Apply `@Roles('admin')` at controller or handler scope.
- Read the acting administrator ID with `@CurrentUser('id')`.
- Validate bodies and queries through DTOs.
- Parse and validate identifiers rather than relying on unchecked `Number(id)`.
- Add `@ApiBearerAuth`, `@ApiTags`, `@ApiOperation`, and response metadata.
- Keep transition rules in the service.

## Listing transition matrix

Enforce only policy-approved transitions:

| Operation | From | To | Required side effects |
|---|---|---|---|
| Approve | `pending` | `active` | Set `publishedAt` once, audit, notify owner, enqueue saved-search matching |
| Reject | `pending` | `rejected` | Audit reason, notify owner |
| Hide | `active` | `hidden` | Audit reason |
| Restore | `hidden` | `active` | Audit |
| Expire | Policy-defined live state | `expired` | Audit and remove from public results |

Reject invalid or repeated transitions. Do not let ordinary landlord endpoints write `status`, `isVerified`, `verifiedAt`, `publishedAt`, or moderation history.

## Atomic audit trail

Make the room status update and `RoomModeration` creation atomic:

```ts
await prisma.$transaction([
  prisma.room.update({ where: { id: roomId }, data }),
  prisma.roomModeration.create({
    data: { roomId, adminId, action, note },
  }),
]);
```

- Record the acting administrator.
- Record the matching `ModerationAction`.
- Preserve an optional reason for rejection or hiding.
- Keep history ordered and attributable.
- Use `onDelete: Restrict` for the administrator relation so audit history cannot become anonymous.
- Do not claim verification changes are in `RoomModeration` unless the enum and schema explicitly support verification actions.

For concurrency-sensitive transitions, prefer a conditional update or transaction that proves the expected prior status at write time rather than relying only on a stale pre-read.

## Approval side effects

Keep the state transition authoritative and separate from recoverable delivery work.

- Enqueue a minimal `{ roomId }` saved-search job after successful approval.
- Reload the authoritative active room inside the processor.
- Keep queue enqueueing idempotent or recoverable through the periodic scan.
- Notify the listing owner after approval or rejection.
- Decide explicitly whether a side-effect failure should fail the request, be retried, or be logged as best-effort.
- Never send external notifications inside the database transaction.

Avoid comments that say “fire-and-forget” when the code actually awaits a best-effort service.

## Verification

- Only administrators may set `isVerified`.
- Set `verifiedAt` when verification becomes true and clear it when false.
- Prevent verification through create or ordinary update DTOs.
- Decide and document whether verification needs its own audit model or new moderation enum values before adding audit records.
- Do not conflate listing approval with identity or location verification.

## Reports

- Allow filtering and pagination with bounded DTO fields.
- Preserve the reporter and reported room safely without leaking unnecessary private data.
- Allow only valid report status transitions.
- Record `resolvedById`, `resolvedAt`, resolution status, and an optional resolution note.
- Reject attempts to resolve an already closed report.
- If report resolution also hides a room or bans a user, make the cross-resource policy explicit and transactional where atomicity is required.

## User bans

- Prevent an administrator from banning their own account.
- Prevent ordinary administrators from banning other administrators unless a higher-role policy exists.
- Soft-delete users rather than hard-delete them.
- Increment `tokenVersion` or otherwise revoke all sessions immediately.
- Ensure login and refresh reject banned users.
- Return only the safe user select.
- Define whether unban preserves the incremented token version; do not restore old sessions.

## Public visibility

After moderation changes:

- Public search and detail return only `active`, non-deleted rooms.
- Hidden, rejected, pending, expired, and deleted rooms disappear from public endpoints.
- Owners can still access their own listings through owner-scoped management endpoints where policy permits.
- Verified-first ranking must not expose non-active listings.

## Tests

Use `test-backend-feature` and cover:

- 401 for unauthenticated callers.
- 403 for non-admin callers.
- Allowed and forbidden transition pairs.
- Status update and audit creation in the same transaction.
- `publishedAt` preservation on approval.
- Self-ban and admin-ban protection.
- Session revocation on ban.
- Safe report resolution and repeat-resolution rejection.
- Queue and owner-notification behavior.
- Public visibility after hide, reject, restore, and soft delete.
- Concurrent or repeated moderation requests where relevant.

Run targeted Jest tests, then lint and build. Add e2e coverage for guard wiring and critical moderation endpoints.
