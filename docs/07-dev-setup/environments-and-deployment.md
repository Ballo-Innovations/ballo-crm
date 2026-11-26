# Environments & Deployment

How BalloCRM gets from a laptop to dev, stage and prod. Decision record:
[ADR-004](../02-architecture/adr/ADR-004-hosting-and-environments.md). Owner: Dev C.

## Environments

| Environment | Branch  | App URL                                             | API URL                                                 | Host                                | Who deploys                          |
| ----------- | ------- | --------------------------------------------------- | ------------------------------------------------------- | ----------------------------------- | ------------------------------------ |
| local       | any     | `http://localhost:3000`                             | `http://localhost:3000/api/v1`                          | your laptop                         | you (`pnpm dev`)                     |
| dev         | `dev`   | `https://dev-hackerthon-crm.balloinnovations.com`   | `https://api.dev-hackerthon-crm.balloinnovations.com`   | shared dev/staging VM               | automatic on merge                   |
| stage       | `stage` | `https://stage-hackerthon-crm.balloinnovations.com` | `https://api.stage-hackerthon-crm.balloinnovations.com` | shared dev/staging VM               | automatic on merge                   |
| prod        | `main`  | `https://hackerthon-crm.balloinnovations.com`       | `https://api.hackerthon-crm.balloinnovations.com`       | separate host (not yet provisioned) | automatic after an approver says yes |

- **dev** is where merged tickets land first. It can break. `db:seed --reset` is allowed.
- **stage** is the rehearsal copy: the evening QA checklist, the demo script and the
  definition-of-done walk-through all run here.
- **prod** is what the judges see. Nothing reaches it without passing stage.

Every environment has its own database, MinIO bucket, secrets and containers. They share nothing
but the VM and its reverse proxy.

## Current status (2026-11-20)

| Piece                                                               | State                                              |
| ------------------------------------------------------------------- | -------------------------------------------------- |
| `dev`, `stage`, `main` branches, protected                          | Done                                               |
| GitHub environments `dev`, `stage`, `prod` (prod needs an approver) | Done                                               |
| Pipeline account `crm-ci` and its secrets for dev and stage         | Done                                               |
| Postgres and MinIO for dev and stage on the VM                      | Running                                            |
| Restricted `ballocrm` host command                                  | Installed and tested                               |
| Team SSH accounts                                                   | None yet - each teammate adds a key (see below)    |
| DNS records                                                         | Not created                                        |
| Deploys (`DEPLOY_ENABLED`)                                          | Off in all three environments until DNS resolves   |
| First image build and first deploy                                  | Not run yet - the first pipeline run is its test   |
| First Prisma migration (ticket E0-03)                               | Not written - `migrate deploy` applies nothing yet |
| Nightly backup cron entries                                         | Not added                                          |
| Prod host and its secrets (ticket E0-13)                            | Not provisioned                                    |
| Uptime check on the stage and prod health URLs                      | Not set up                                         |

To switch deploys on for dev and stage: create the DNS records, then set `DEPLOY_ENABLED` to
`true` in the `dev` and `stage` GitHub environments.

## The API hostname

There is no separate backend service (see ADR-001 and ADR-004). The API host is the same Next.js
app; the proxy adds the `/api` prefix:

```
https://api.<app host>/v1/leads   ->   app  /api/v1/leads
https://<app host>/api/v1/leads   ->   app  /api/v1/leads      (same handler)
```

Use the API host for integrations, webhooks and API-key clients. The UI keeps using the app host,
where the session cookie lives. `GET /v1/health` (or `/api/v1/health`) is public and returns the
environment and the deployed release.

## What runs where

Each environment is one Docker Compose project made from [deploy/compose.yml](../../deploy/compose.yml):

| Service   | Image                                               | Memory cap | Notes                                       |
| --------- | --------------------------------------------------- | ---------- | ------------------------------------------- |
| `app`     | `ghcr.io/ballo-innovations/ballo-crm:<sha>`         | 768 MB     | Next.js standalone server, port 3000        |
| `db`      | `postgres:16-alpine`                                | 512 MB     | Not published outside the Docker network    |
| `minio`   | `cgr.dev/chainguard/minio`                          | 256 MB     | Not published outside the Docker network    |
| `migrate` | `ghcr.io/ballo-innovations/ballo-crm-migrate:<sha>` | -          | One-off: `prisma migrate deploy`, `db:seed` |

`mock-integrations` joins this file when ticket E9-02 builds it.

MinIO stopped publishing its own images on Docker Hub and Quay, so both compose files use
Chainguard's build of the same server. The `contracts` bucket is not created by the deploy; the
contract upload code must create it if it is missing (ticket E7-03).

### The VM (dev and stage)

- A VM shared with other projects' dev and staging environments. Its address and sizing are in
  the team's private access doc, not in this repo. Two BalloCRM environments need about 3 GB of
  memory.
- Traefik v3 already terminates TLS on ports 80/443 with Let's Encrypt (HTTP challenge, resolver
  name `letsencrypt`, entrypoint `https`). Our containers only carry Traefik labels; we do not
  touch the Traefik config.
- Layout follows the VM's existing convention: `/var/apps/ballocrm-dev/deploy/` and
  `/var/apps/ballocrm-stage/deploy/`, each holding `compose.yml`, `deploy.sh`, `backup.sh`, `.env`.
- Only ports 22, 80 and 443 are public. Never add a `ports:` entry for Postgres or MinIO.
- This VM belongs to another product. Do not restart Traefik, prune Docker volumes or images
  globally, or touch anything outside `/var/apps/ballocrm-*`.

### Prod

Prod runs the same compose file on a separate small host so that another project's staging work
cannot take the demo down. That host is not provisioned yet (ticket E0-13). It needs Docker,
Traefik configured like the VM's, and the two prod DNS records. Until it exists, pushes to `main`
build images and skip the deploy step. The Vercel project connected to this repo keeps serving the
landing page in the meantime; remove it once prod is live.

## DNS

None of these records exist yet. Traefik cannot issue a certificate until the
record resolves. `<vm-ip>` is in the team's private access doc.

| Type | Host                       | Value        |
| ---- | -------------------------- | ------------ |
| A    | `dev-hackerthon-crm`       | `<vm-ip>`    |
| A    | `api.dev-hackerthon-crm`   | `<vm-ip>`    |
| A    | `stage-hackerthon-crm`     | `<vm-ip>`    |
| A    | `api.stage-hackerthon-crm` | `<vm-ip>`    |
| A    | `hackerthon-crm`           | prod host IP |
| A    | `api.hackerthon-crm`       | prod host IP |

## How a deploy works

[.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) runs on every push to `dev`,
`stage` or `main`:

1. **Checks** - lint, typecheck, unit tests, build (the same job PRs run).
2. **Image** - builds the `runner` and `migrate` targets of the [Dockerfile](../../Dockerfile)
   and pushes both to GHCR, tagged with the commit SHA.
3. **Deploy** - connects as the pipeline account `crm-ci`, which like every team account can only
   run the `ballocrm` host command. It uploads `deploy/compose.yml` and the scripts, logs the host in to GHCR
   with the job's short-lived token, and runs `./deploy.sh <sha>`: pull, start db and MinIO,
   `prisma migrate deploy`, start the app and wait until it is healthy.
4. **Smoke test** - `GET <APP_URL>/api/v1/health` must report the new SHA.

The deploy step is skipped until the GitHub environment has `DEPLOY_ENABLED=true`, so nothing
deploys by accident before an environment is set up.

## SSH access for the team

Teammates reach BalloCRM on the VM without reaching the other projects on it. Each person has an
account `crm-<name>` whose SSH key is pinned to one root-owned command, `ballocrm`. There is no
host shell, no file copy, no port forwarding and no Docker access; the command only works inside
`/var/apps/ballocrm-<env>/deploy` and checks every word it is given.

```bash
ssh crm-<name>@<vm-ip>                    # help (replace <vm-ip> with the address from the team's access doc)
ssh crm-<name>@<vm-ip> dev status         # containers and deployed release
ssh crm-<name>@<vm-ip> dev health
ssh crm-<name>@<vm-ip> dev logs           # or: logs db | logs minio
ssh crm-<name>@<vm-ip> dev follow         # stream logs
ssh crm-<name>@<vm-ip> dev restart
ssh crm-<name>@<vm-ip> stage migrate      # prisma migrate deploy
ssh crm-<name>@<vm-ip> dev seed --reset   # never on prod; stage backs up first
ssh crm-<name>@<vm-ip> stage backup       # and: backups
ssh crm-<name>@<vm-ip> stage rollback     # previous release
ssh crm-<name>@<vm-ip> dev deploy <sha>   # a SHA whose image is already on the host
ssh -t crm-<name>@<vm-ip> dev psql        # database prompt
ssh -t crm-<name>@<vm-ip> dev shell       # shell inside the app container
```

A host alias in `~/.ssh/config` shortens this to `ssh crm dev logs`:

```
Host crm
  HostName <vm-ip>
  User crm-<name>
  IdentityFile ~/.ssh/<your key>
```

Things to know:

- **New commits are deployed by merging** (`dev`, `stage`, `main`), not over SSH. `deploy <sha>`
  only re-deploys an image the pipeline already delivered to the host; it is for rollbacks.
- `psql` and `shell` run inside that environment's containers. They can see that environment's
  data and secrets, and nothing outside it.
- Every command is written to the host's system log with the account name
  (`journalctl -t ballocrm`).
- The pieces live in [deploy/host/](../../deploy/host): `ballocrm` (the command), `ballocrm-ssh`
  (the forced SSH command), `ballocrm.sudoers` and `ballocrm-admin`. A change to them is installed
  by a host admin, not by the pipeline.

### Using dev data from your laptop (SSH tunnel)

Your account may open a tunnel to the **dev** database and file storage, and to nothing else
(stage and prod are never reachable this way). Add this to `~/.ssh/config` next to the `crm` host:

```
Host crm-tunnel
  HostName <vm-ip>
  User crm-<name>
  IdentityFile ~/.ssh/<your key>
  IdentitiesOnly yes
  ExitOnForwardFailure yes
  LocalForward 15432 127.0.0.1:15432
  LocalForward 19000 127.0.0.1:19000
```

Run `ssh -N crm-tunnel` and leave it open, then in your `.env`:

```
DATABASE_URL=postgresql://ballocrm:<dev POSTGRES_PASSWORD>@localhost:15432/ballocrm
S3_ENDPOINT=http://localhost:19000
S3_ACCESS_KEY=ballocrm
S3_SECRET_KEY=<dev MINIO_ROOT_PASSWORD>
S3_BUCKET=contracts
```

The passwords are in the team's private access doc. Everyone shares this data, so:

- Never run `prisma migrate dev`, `prisma db push` or `db:seed --reset` through the tunnel.
  Create a migration with `prisma migrate dev --create-only` against a local database
  (`docker compose up db`), ship it in your PR, and the deploy applies it.
- Test destructive changes (deleting, bulk edits) locally first.
- If dev data gets into a bad state, ask before resetting it: `ssh crm dev seed --reset`.

To go back to fully local, start `docker compose up` and use the values in `.env.example`.

How it is set up: `DB_PUBLISH` and `S3_PUBLISH` in dev's server `.env` publish the two services
on the host's loopback only, and `ballocrm-admin add-user` grants `port-forwarding` with
`permitopen` for exactly those two ports.

### Giving and removing access (host admin)

A teammate sends their **public** key (`~/.ssh/id_ed25519.pub`). As root on the host:

```bash
ballocrm-admin add-user <name> < their-key.pub     # creates crm-<name>
ballocrm-admin remove-user <name>                  # deletes it and ends their sessions
ballocrm-admin list-users
```

Easier, when the teammate has an SSH key on their GitHub account (it uses the first one):

```bash
ballocrm-admin add-github-user <github-username> [name]
```

Who has an account is tracked in the team's private access doc, not here.

One key per person; never share an account. The pipeline's account is `crm-ci`
(`ballocrm-admin add-user ci < ci-key.pub`); it alone may upload deploy files and log in to the
registry. Root access to the VM stays with the people who already hold it.

## One-time setup

### On the host (host admin)

Already done on the dev/staging VM. For a new host (prod), copy `deploy/host/` to it and run as root:

```bash
install -o root -g root -m 0755 ballocrm ballocrm-ssh /usr/local/bin/
install -o root -g root -m 0750 ballocrm-admin /usr/local/sbin/
visudo -cf ballocrm.sudoers && install -o root -g root -m 0440 ballocrm.sudoers /etc/sudoers.d/ballocrm
ballocrm-admin init-env prod hackerthon-crm.balloinnovations.com
```

`init-env` creates `/var/apps/ballocrm-<env>/deploy/.env` (mode 600) with freshly generated
secrets, different in every environment. Edit it only to add `BRUTUS_API_KEY` or integration
keys (`BALLOADS_API_URL`, `BALLOADS_API_KEY`, `BALLOADS_WEBHOOK_SECRET`). Then add the nightly backup to root's crontab, once per environment (not yet added on the
VM):

```
15 1 * * * /var/apps/ballocrm-dev/deploy/backup.sh >> /var/log/ballocrm-dev-backup.log 2>&1
```

### In GitHub (repo admin)

Done for dev and stage. For prod, or to rebuild the setup:

1. Long-lived branches `dev`, `stage` and `main`, each protected: pull request required, CI
   `check` must pass, no approval required, no force pushes.
2. Environments `dev`, `stage` and `prod`, with required reviewers on `prod`.
3. In each environment:

   | Kind     | Name                 | Value                                                     |
   | -------- | -------------------- | --------------------------------------------------------- |
   | Secret   | `DEPLOY_HOST`        | host IP                                                   |
   | Secret   | `DEPLOY_USER`        | `crm-ci`                                                  |
   | Secret   | `DEPLOY_SSH_KEY`     | the private half of the key given to `add-user ci`        |
   | Secret   | `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan <host>`, verified against the host |
   | Variable | `APP_URL`            | the app URL from the table above                          |
   | Variable | `DEPLOY_ENABLED`     | `true`, once the host directory and DNS are ready         |

## Secrets

- Real values live in two places only: the `.env` on the host (mode 600) and GitHub environment
  secrets. Never in the repo, a PR, a ticket, a chat message or a Claude prompt.
- `.env.example` and `deploy/.env.example` list every variable with no real values. A new
  variable is added to both, and to `src/lib/env.ts`, in the same PR.
- Rotate a secret (host admin): edit the host `.env`, then re-run `./deploy.sh "$(cat .release)"`
  in that environment's deploy directory.

## Database rules

| Action                  | local | dev             | stage                                  | prod                             |
| ----------------------- | ----- | --------------- | -------------------------------------- | -------------------------------- |
| `prisma migrate dev`    | yes   | never           | never                                  | never                            |
| `prisma migrate deploy` | -     | on every deploy | on every deploy                        | on every deploy                  |
| `pnpm db:seed`          | yes   | yes             | by hand, announced in the team channel | by hand, once, before the demo   |
| `pnpm db:seed --reset`  | yes   | yes             | by hand, after a backup                | blocked in code (`APP_ENV=prod`) |

Run these through the host command, for example `ssh crm-<name>@<host> stage seed`.

A migration that drops or renames a column ships in two releases (add and backfill, then remove),
because the old app keeps running while the new one starts.

## Backups and restore

`backup.sh` writes a compressed `pg_dump` to `/var/backups/ballocrm/<env>/` and keeps seven days.
Restore (host admin, as root):

```bash
cd /var/apps/ballocrm-stage/deploy
gunzip -c /var/backups/ballocrm/stage/<file>.sql.gz | docker compose -f compose.yml exec -T db psql -U ballocrm ballocrm
```

Do one restore on stage before the demo week so the first real restore is not on demo day.
Contract PDFs in MinIO are not backed up by this script; they can be regenerated from the
contract record.

## Rollback

- **App:** run the Deploy workflow by hand, choose the environment and give the last good SHA as
  the ref. Or `ssh crm-<name>@<host> <env> rollback`.
- **Database:** migrations are forward-only. Fix forward with a new migration; restore a backup
  only if data is damaged.

## Promotion

`feat/*` -> PR to `dev` -> PR `dev` to `stage` -> PR `stage` to `main`. Details in
[05-git-workflow.md](../04-delivery/05-git-workflow.md).
