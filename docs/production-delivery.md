# RoomRent delivery and operations guide

## Release flow

Every pull request runs backend and frontend checks. A push to `main` does not
deploy directly from the moving branch. The `Deploy` workflow starts only after
the `CI` workflow for that exact push has succeeded.

```text
PR
  -> backend lint/build/test
  -> frontend lint/typecheck/test/build
  -> required review
  -> merge main
  -> deploy the exact 40-character commit SHA to staging
  -> staging smoke test
  -> required production approval
  -> deploy the same SHA to production
  -> production smoke test
  -> external monitoring and alerting
```

The current deployment builds images on the target host from the checked-out
commit SHA. It does not run `git pull origin main`, so a later untested commit
cannot be deployed accidentally. The next hardening step, when a registry is
available, is to publish immutable images to GHCR and deploy image digests.

## GitHub setup

Create two GitHub Environments:

- `staging`: no approval required; used for automatic deployment after CI.
- `production`: enable **Required reviewers** and add the people who may
  approve a production release.

Configure these repository/environment variables:

| Name                      | Meaning                                            |
| ------------------------- | -------------------------------------------------- |
| `STAGING_FRONTEND_URL`    | Public staging frontend URL                        |
| `STAGING_API_URL`         | Public staging API URL without a trailing slash    |
| `PRODUCTION_FRONTEND_URL` | Public production frontend URL                     |
| `PRODUCTION_API_URL`      | Public production API URL without a trailing slash |

Configure these `staging` environment secrets:

| Name                                   | Meaning                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `BACKEND_STAGING_VPS_HOST`             | Staging backend host                                                        |
| `BACKEND_STAGING_VPS_USER`             | SSH user for staging backend                                                |
| `BACKEND_STAGING_DEPLOY_PATH`          | Repository root on staging backend                                          |
| `BACKEND_STAGING_VPS_SSH_PRIVATE_KEY`  | SSH private key                                                             |
| `BACKEND_STAGING_VPS_HOST_KEY`         | Complete pinned SSH host key line suffix, for example `ssh-ed25519 AAAA...` |
| `FRONTEND_STAGING_VPS_HOST`            | Staging frontend host                                                       |
| `FRONTEND_STAGING_VPS_USER`            | SSH user for staging frontend                                               |
| `FRONTEND_STAGING_DEPLOY_PATH`         | `client/` directory on staging frontend                                     |
| `FRONTEND_STAGING_VPS_SSH_PRIVATE_KEY` | SSH private key                                                             |
| `FRONTEND_STAGING_VPS_HOST_KEY`        | Complete pinned SSH host key line suffix                                    |

Configure these `production` environment secrets:

| Name                           | Meaning                                             |
| ------------------------------ | --------------------------------------------------- |
| `BACKEND_VPS_HOST`             | Production backend host                             |
| `BACKEND_VPS_USER`             | SSH user for production backend                     |
| `BACKEND_DEPLOY_PATH`          | Repository root on production backend               |
| `BACKEND_VPS_SSH_PRIVATE_KEY`  | SSH private key                                     |
| `BACKEND_VPS_HOST_KEY`         | Complete pinned SSH host key line suffix            |
| `FRONTEND_VPS_HOST`            | Production frontend host                            |
| `FRONTEND_VPS_USER`            | SSH user for production frontend                    |
| `FRONTEND_DEPLOY_PATH`         | `client/` directory on production frontend          |
| `FRONTEND_VPS_SSH_PRIVATE_KEY` | SSH private key                                     |
| `FRONTEND_VPS_HOST_KEY`        | Complete pinned SSH host key line suffix            |
| `PRODUCTION_ALERT_WEBHOOK_URL` | Slack/Discord-compatible webhook for probe failures |

The SSH host key value must be obtained from a trusted channel and pinned. Do
not replace it with an unchecked `ssh-keyscan` result in CI.

### Branch protection

In **Settings → Branches → Branch protection rules** for `main`:

1. Require a pull request before merging.
2. Require at least one approving review.
3. Dismiss stale approvals after new commits.
4. Require status checks: `Backend` and `Frontend` from `CI`.
5. Require branches to be up to date before merging.
6. Restrict direct pushes and force pushes.

These settings are repository configuration and cannot be guaranteed by a file
in this checkout. Verify them in GitHub before calling the process protected.

## VPS preparation

On each staging/production host:

1. Clone the repository into the deploy path.
2. Ensure the deploy user can run Docker and Docker Compose.
3. Create `server/.env.staging` or `server/.env.production` from the backend
   environment template. Keep the file only on the host.
4. On the frontend host, create `client/.env.staging` or
   `client/.env.production` with the correct API and public site URLs.
5. Ensure Nginx/CloudPanel proxies the public domains to the local ports:
   backend `3000`, frontend `5000`.
6. Ensure the deploy user can fetch the private repository without an
   interactive prompt.

The staging database and Redis volumes are deliberately named differently from
production in `docker-compose.staging.yml`.

## Smoke tests

The deployment workflow runs `ops/smoke-test.sh` against staging and checks the
frontend root plus `${API_URL}/health`. Production runs the same checks after
deployment. These checks verify reachability, HTTP success, and database-backed
API readiness; they are not a replacement for end-to-end product tests.

## Rollback procedure

Rollback is manual and approval-protected:

1. Identify the last known-good 40-character commit SHA.
2. Open **Actions → Roll back production → Run workflow**.
3. Enter the SHA and an incident reason.
4. Approve the `production` environment deployment.
5. Confirm the production frontend and API smoke tests pass.
6. Record the incident, failed release SHA, restored SHA, and follow-up action.

Test rollback before the first real incident:

1. Deploy a known-good release to staging.
2. Deploy a second release that changes a visible, reversible value.
3. Run the rollback workflow against the first SHA in a non-production test
   window, or run the same SSH commands against staging.
4. Confirm both services return to the first version and health checks pass.

The deploy scripts retain the current release SHA in an ignored local state
file. The state file is operational metadata only; the authoritative release is
the commit SHA recorded by GitHub Actions.

## Monitoring and alerting

`.github/workflows/monitor-production.yml` runs every five minutes on a GitHub
runner outside the VPS. It probes the public frontend and API health endpoint.
If a probe fails, it posts a JSON `text` payload to
`PRODUCTION_ALERT_WEBHOOK_URL` and fails the workflow.

This is a baseline monitor. Add provider-level alerts for VPS disk space,
Docker container health, PostgreSQL, Redis, TLS expiry, and backup failures as
the traffic and availability requirements grow.

## Database migration policy

Every migration must be backward-compatible with the currently running app and
the immediately previous release. Use expand/contract migrations:

1. Add nullable columns, indexes, or new tables first.
2. Deploy code that can read both old and new shapes.
3. Backfill data in a controlled job or maintenance window.
4. Switch reads/writes to the new shape.
5. Remove old columns only in a later release after the old app is no longer
   used.

Avoid destructive operations, irreversible data transforms, and renames in the
same release as the code that first depends on them. Take a database backup
before production migrations and verify restore procedures regularly.

The migration command runs before the new backend container starts. If a
migration is not backward-compatible, rollback of the application image alone
may not be safe.
