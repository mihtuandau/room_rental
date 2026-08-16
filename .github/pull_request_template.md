## Release safety checklist

- [ ] Backend and frontend CI checks pass.
- [ ] This change does not add secrets or production-only data.
- [ ] If the database schema changes, the migration is backward-compatible with the previous release.
- [ ] If the database schema changes, the migration has a backup and rollback/forward-fix plan.
- [ ] If the change affects an API contract, the old frontend/backend remains compatible during rollout.
- [ ] Staging smoke test has been run or is not applicable.
- [ ] Monitoring and alert impact has been considered.
