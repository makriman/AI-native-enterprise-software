# AI Native Enterprise Software

> The open-source control plane for building, changing, testing, approving, deploying, and rolling back enterprise software with AI.

[![CI](https://github.com/makriman/AI-native-enterprise-software/actions/workflows/ci.yml/badge.svg)](https://github.com/makriman/AI-native-enterprise-software/actions/workflows/ci.yml)
[![License: LGPL-3.0-or-later](https://img.shields.io/badge/license-LGPL--3.0--or--later-blue.svg)](LICENSE)
[![Self Hosted](https://img.shields.io/badge/deploy-self--hosted-black.svg)](infra/compose/docker-compose.yml)

Enterprise software is entering its AI-native era.

The first cloud-native giants did not win by putting old software on new servers. They won because the cloud changed what enterprise software could be: always on, always updated, browser-native, subscription-funded, and far easier to roll out than the old on-premise systems.

AI creates the same break in the road.

The next generation of enterprise software will not be a static system of record with a chatbot glued to the corner. It will be an implementation engine: a system that understands business intent, turns it into versioned software changes, tests those changes, shows the diff, opens a sandbox, asks for approval, deploys safely, and keeps an audit trail.

That is what this repo is building.

AI Native Enterprise Software is an open-source, self-hosted implementation platform for companies that want their business systems to evolve at the speed of thought without giving an agent the keys to production.

## The Idea

Today's CRM, ITSM, ERP, HR, finance, and operations platforms are still mostly built around humans configuring screens, clicking through admin panels, waiting on consultants, filing tickets, and copy-pasting requirements into implementation backlogs.

That workflow is going away.

In an AI-native enterprise stack, an operator should be able to say:

```text
Create a partner onboarding workflow with document collection, approval routing,
portal upload, SLA reminders, and a dashboard for overdue cases.
```

The platform should then:

1. Understand the request.
2. Produce a plan.
3. Normalize the work into a canonical spec.
4. Generate deterministic scaffolding.
5. Let an AI implementation engine complete the logic.
6. Run policy checks and tests.
7. Deploy to a sandbox.
8. Show the diff, logs, risks, docs, and rollback plan.
9. Wait for human approval.
10. Promote through staging and production with audit and rollback.

That loop is the product.

## Why This Matters

Salesforce, ServiceNow, NetSuite, SuccessFactors, and the rest of the early SaaS wave proved something important: when a platform shift happens, the winners are usually not the companies that bolt the new technology onto yesterday's architecture.

Cloud-native software replaced the old enterprise stack because it changed the operating model.

AI-native software will do the same.

Enterprise software used to be configured by administrators and extended by implementation partners. The new model is governed AI implementation: business people describe outcomes, AI produces reviewable software artifacts, and the company keeps control through Git, tests, environments, approvals, audit logs, and rollback.

The era ahead combines software with a built-in implementation agency:

- AI-native revenue operations delivery
- AI-native HR operations delivery
- AI-native accounting workflow delivery
- AI-native customer onboarding delivery
- AI-native internal tooling delivery
- AI-native implementation execution that replaces slow agency loops

Not a chatbot. Not a demo agent. A governed implementation and delivery system.

## What You Can Build

Use this platform to create real enterprise workflows, not just code snippets.

### Revenue And CRM

- Lead qualification flows
- Territory and assignment rules
- Quote approval workflows
- Renewal and expansion playbooks
- Customer health dashboards
- Partner relationship management
- Sales activity reminders and SLAs

### Customer And Partner Onboarding

- Onboarding case objects
- Document checklists
- Secure portal upload pages
- Internal approval routing
- Reminder jobs
- Overdue onboarding dashboards
- UAT scripts and rollout notes

### IT And Service Operations

- Ticket intake workflows
- Priority and escalation rules
- SLA policies
- Change approval flows
- Asset and vendor tracking
- Internal service catalogs
- Operational reporting

### HR And Employee Operations

- Employee onboarding workflows
- Equipment request approvals
- Training checklists
- Policy acknowledgement flows
- Manager review queues
- Internal HR case handling

### Finance And Procurement

- Purchase approval routing
- Vendor onboarding
- Spend thresholds
- Exception workflows
- Budget review dashboards
- Audit-ready change logs

### Data Migration

- Legacy CRM imports
- Contact and company deduplication
- Product catalog migration
- Mapping files
- Dry-run validation
- Failed-row quarantine
- Idempotent reruns using external IDs

### Integrations And Automation

- Webhooks
- REST adapters
- OAuth2 connectors
- Scheduled sync jobs
- Retry queues
- Import and export jobs
- Connector test harnesses

## What Makes It Different

Most AI enterprise demos stop at "generate some code" or "talk to your CRM."

This project is about the hard part: governed implementation delivery.

| Old implementation model | AI-native implementation model |
| --- | --- |
| Requirements doc | Build request |
| Consultant scoping call | AI-generated plan |
| Manual configuration | Canonical spec and deterministic compiler |
| Hidden admin changes | Versioned artifacts |
| Risky production edits | Sandbox-first workflow |
| Screenshots in a ticket | Diffs, logs, previews, tests, docs |
| Tribal knowledge | Audit trail and generated runbooks |
| Painful rollback | Deployment records and rollback plans |

## Core Workflow

```text
request
  -> plan
  -> canonical spec
  -> deterministic scaffold
  -> AI implementation
  -> validation
  -> sandbox
  -> approval
  -> staging
  -> production
  -> audit
  -> drift detection
  -> upgrade path
```

## Architecture

```text
User Browser
  -> AI Console
     -> Control API
        -> Planner
        -> Spec Schema
        -> Spec Compiler
        -> Policy Engine
        -> Runner Supervisor
           -> Managed Runner
           -> Edge Agent
        -> Deployment Orchestrator
        -> Artifact Store
        -> Log Gateway
        -> Audit Store

Business Application Runtime
  <- Bridge Add-on
  -> Snapshot Export
  -> Drift Detection
```

## Main Components

- `apps/ai-console`: the business-facing console for build requests, approvals, diffs, logs, tests, deployments, drift, and audit.
- `apps/control-api`: the authoritative backend for requests, specs, policy, approvals, artifacts, deployment records, and drift scans.
- `apps/runner-supervisor`: isolated execution management for AI implementation jobs.
- `apps/edge-agent`: local execution agent for people who want to use their ChatGPT subscription.
- `apps/log-gateway`: live and replayable build log streaming.
- `packages/spec-schema`: canonical customization spec.
- `packages/spec-compiler`: deterministic scaffold generator.
- `packages/policy-engine`: risk classification and safety gates.
- `packages/odoo-adapter`: runtime snapshot and drift primitives.[^runtime]
- `addons/bridge`: the bridge between the application runtime and the AI control plane.[^runtime]

## Current Status

This repository is early, but the spine is real:

- Monorepo scaffold
- AI Console shell
- Control API lifecycle routes
- Canonical spec schema
- Deterministic compiler
- Policy engine baseline
- Runner supervisor skeleton
- Edge agent skeleton
- Runtime bridge add-on
- Docker Compose stack
- CI skeleton
- Example build requests
- Migration map examples
- Operations runbooks

The next major push is persistence, real runner isolation, deeper tests, deployment executors, and production-grade observability.

## Quick Start: Local Development

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker and Docker Compose
- Git

### 1. Clone

```bash
git clone --recurse-submodules https://github.com/makriman/AI-native-enterprise-software.git
cd AI-native-enterprise-software
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive
```

### 2. Bootstrap

```bash
./infra/scripts/bootstrap.sh
```

This installs workspace dependencies, prepares environment files, and pins the reference application runtime.

### 3. Configure local secrets

```bash
cp infra/compose/.env.example infra/compose/.env
```

Open `infra/compose/.env` and replace the development passwords before exposing the stack to any network.

### 4. Start the stack

```bash
docker compose -f infra/compose/docker-compose.yml --env-file infra/compose/.env up -d --build
```

### 5. Open the console

- AI Console: `http://localhost:3000`
- Control API health: `http://localhost:4000/health`
- Reverse proxy: `http://localhost:8080`
- Business application runtime: `http://localhost:8069`
- Artifact store console: `http://localhost:9001`

### 6. Create a build

Open `http://localhost:3000/build-composer` and submit:

```text
Create a partner onboarding workflow with document collection,
approval routing, SLA reminders, portal upload, and an overdue dashboard.
```

Or call the API:

```bash
curl -X POST http://localhost:4000/api/v1/builds \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "ws_default",
    "instance_id": "inst_default",
    "title": "Partner onboarding workflow",
    "prompt": "Create a partner onboarding workflow with document collection, approval routing, SLA reminders, portal upload, and an overdue dashboard.",
    "attachments": [],
    "execution_mode": "managed_api",
    "deployment_path": ["sandbox", "staging", "production"],
    "risk_tolerance": "medium",
    "auto_deploy_sandbox": true
  }'
```

## Connect Your ChatGPT Subscription

There are two execution modes.

### Managed API Mode

Use this for reliable server-side background work.

Best for:

- queued builds
- CI-triggered builds
- scheduled drift reconciliation
- unattended validation
- shared team environments

High-level setup:

1. Add an OpenAI API connection in the AI Console.
2. Store the API key in your server secret manager.
3. Select `managed_api` when creating a build.
4. Let the runner supervisor allocate an isolated job workspace.
5. Review the generated artifacts and approve promotion.

### ChatGPT Edge Mode

Use this when a developer or operator wants builds to run through their own ChatGPT-linked Codex setup.

Best for:

- founder mode
- local experimentation
- customer-controlled execution
- environments where ChatGPT credentials must never be stored centrally

High-level setup:

1. Install the project locally or on a trusted workstation.
2. Install and authenticate Codex CLI with your ChatGPT account.
3. Register an edge agent with the control plane.
4. Choose `chatgpt_edge` in the Build Composer.
5. The control plane queues the job.
6. Your edge agent claims it, executes locally, and streams artifacts back.

Run the edge agent locally:

```bash
CONTROL_API_URL=http://localhost:4000 \
WORKSPACE_ID=ws_default \
AGENT_NAME=my-local-edge-agent \
AGENT_TOKEN=replace-with-a-random-token \
pnpm --filter @oae/edge-agent dev
```

Or with Compose:

```bash
docker compose -f infra/compose/docker-compose.yml --env-file infra/compose/.env --profile edge up -d edge-agent
```

The important design choice: ChatGPT-linked auth stays on the machine you control. The shared server receives logs and artifacts, not your browser session.

## Deploy On DigitalOcean

### Option A: One Droplet With Docker Compose

Good for pilots, demos, and small internal deployments.

Recommended starting size:

- 4 vCPU
- 8 GB RAM
- 80 GB disk
- Ubuntu 24.04 LTS

Steps:

```bash
ssh root@YOUR_DROPLET_IP
apt update
apt install -y git docker.io docker-compose-plugin
git clone https://github.com/makriman/AI-native-enterprise-software.git
cd AI-native-enterprise-software
cp infra/compose/.env.example infra/compose/.env
```

Edit `infra/compose/.env`, then run:

```bash
docker compose -f infra/compose/docker-compose.yml --env-file infra/compose/.env up -d --build
```

Add a firewall:

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

For production, place Caddy, Traefik, or Nginx with TLS in front of the console and API.

### Option B: DigitalOcean Managed Services

Use this when you want fewer operational chores.

Recommended mapping:

- App/worker containers: Droplet, App Platform, or Kubernetes
- Control metadata: DigitalOcean Managed PostgreSQL
- Runtime database: DigitalOcean Managed PostgreSQL
- Artifact storage: DigitalOcean Spaces
- Queue/cache: Managed Redis
- TLS: DigitalOcean Load Balancer or your own reverse proxy

Set these environment variables for services:

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

## Deploy On AWS

### Option A: EC2 With Docker Compose

Good for private pilots and fast proof-of-concept environments.

Recommended starting size:

- `t3.xlarge` or `m7i.large`
- Amazon Linux 2023 or Ubuntu 24.04
- EBS gp3 volume with backups enabled

Steps:

```bash
sudo dnf update -y
sudo dnf install -y git docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

Then:

```bash
git clone https://github.com/makriman/AI-native-enterprise-software.git
cd AI-native-enterprise-software
cp infra/compose/.env.example infra/compose/.env
docker compose -f infra/compose/docker-compose.yml --env-file infra/compose/.env up -d --build
```

### Option B: AWS Managed Architecture

Use this for a serious team deployment.

Recommended mapping:

- AI Console: ECS Fargate or EKS
- Control API: ECS Fargate or EKS
- Runner Supervisor: isolated ECS tasks
- Edge Agent: developer workstation or private compute node
- Control metadata: RDS PostgreSQL
- Runtime database: RDS PostgreSQL
- Queue/cache: ElastiCache Redis
- Artifacts: S3
- Secrets: AWS Secrets Manager
- Logs: CloudWatch
- TLS and routing: ALB plus ACM

Production checklist:

- Put production databases in private subnets.
- Keep runner jobs away from production database credentials.
- Store API keys in Secrets Manager.
- Use S3 bucket policies for artifact retention.
- Create backup policies for both metadata and runtime databases.
- Require approval before staging and production deployment.

## Deploy Anywhere Else

The platform is intentionally boring to deploy.

Good targets:

- Hetzner: single VM or Kubernetes
- Fly.io: console/API services plus external Postgres and S3-compatible storage
- Render: web services plus managed Postgres and Redis
- Railway: quick demos and internal prototypes
- Kubernetes: Helm/Kustomize path planned under `infra/k8s`
- Bare metal: Docker Compose behind your own reverse proxy

Minimum service dependencies:

- PostgreSQL
- Redis
- S3-compatible object storage
- container runtime
- reverse proxy with TLS

## Repository Layout

```text
apps/
  ai-console/          # web UI
  control-api/         # authoritative backend
  runner-supervisor/   # run allocation and isolation
  edge-agent/          # ChatGPT-linked local execution
  log-gateway/         # live logs and replay
addons/
  bridge/              # runtime bridge
  generated/           # generated implementation modules
  custom/              # human-authored modules
  test_support/        # test helpers
packages/
  shared-types/
  prompt-packs/
  policy-engine/
  spec-schema/
  spec-compiler/
  odoo-adapter/
  deployment/
infra/
  compose/
  docker/
  nginx/
  scripts/
docs/
examples/
```

## Example Build Requests

### Partner Onboarding

```text
Build a partner onboarding workflow with approval, document collection,
a portal upload page, SLA reminders, and an overdue onboarding dashboard.
```

Expected outputs:

- canonical spec
- generated module scaffold
- portal controller and upload flow
- approval states
- reminder job
- dashboard views
- tests
- docs
- sandbox preview
- rollback plan

### Revenue Operations

```text
Create a revenue operations workspace for inbound leads. Add qualification
fields, routing by region and segment, manager approval for enterprise deals,
and weekly pipeline health reporting.
```

### Procurement

```text
Create a procurement approval workflow with spend thresholds, vendor risk
fields, finance approval above $25,000, and an audit dashboard.
```

### IT Service Desk

```text
Create an internal IT request system with categories, SLA policies,
priority escalation, assignment rules, and weekly reporting.
```

### Migration

```text
Import contacts and companies from a legacy CRM export. Deduplicate by external
ID and email domain, quarantine invalid rows, and produce a dry-run report
before writing any records.
```

## Governance Model

AI is powerful enough to be useful and dangerous enough to need structure.

This project assumes:

- AI should propose and implement changes.
- Humans should approve risky changes.
- Production should receive immutable artifacts.
- Every meaningful change should be versioned.
- Every deployment should have a rollback plan.
- Every generated workflow should include tests and docs.
- Secrets should not leak into prompts, logs, or artifacts.

Default policy checks include:

- upstream baseline edits
- wildcard permission grants
- destructive SQL
- privileged bypasses
- hidden outbound HTTP calls
- cron jobs without documentation
- migrations without rollback notes

## Development Commands

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm lint
```

Start all development services:

```bash
pnpm dev
```

Start only the control API:

```bash
pnpm --filter @oae/control-api dev
```

Start only the AI Console:

```bash
pnpm --filter @oae/ai-console dev
```

## Roadmap

- Persistent database repositories for the Control API
- Real managed implementation-runner integration
- Hardened edge-agent execution
- Sandbox provisioning
- Staging and production deploy executors
- Backup and rollback automation
- Drift detection UI
- Migration assistant UI
- More implementation playbooks
- Full observability stack
- Security hardening for public pilots

## Who This Is For

This is for:

- founders building AI-native vertical SaaS
- operators tired of waiting on implementation tickets
- consultants who want to ship 10x faster
- internal tools teams
- systems integrators reinventing themselves
- companies that want AI speed without production chaos

The old implementation model is a queue.

The new implementation model is a governed compiler for business change.

## Contributing

This project is young and ambitious. The best contributions are practical:

- one strong implementation playbook
- one policy rule
- one deployment hardening improvement
- one test harness
- one real-world sample build
- one clear runbook

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) before opening a pull request.

## Footnotes

[^runtime]: The current reference runtime is built on pinned Odoo Community 19.0 with an overlay architecture. The project does not include or depend on Odoo Enterprise source code. Odoo is the initial open-source business application substrate, not the product identity.
