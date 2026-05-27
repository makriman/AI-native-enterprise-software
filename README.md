# AI Native Enterprise Software

An AI-native control plane for building, changing, testing, approving, deploying, and rolling back enterprise software.

## Mission

Enterprise software should become more adaptable, inspectable, and reversible in the AI-native era. This project explores a control plane where AI can plan changes, generate modules, run policy checks, validate migrations, ship safely, and preserve operational trust.

## What This Repository Contains

A monorepo for an AI-native enterprise software implementation platform: control API, AI console, edge agent, log gateway, runner supervisor, Odoo bridge modules, policies, playbooks, architecture docs, and self-hosting infrastructure.

## Highlights

- Build composer, module catalog, deployment, rollback, drift, logs, audit, policy, and environment health surfaces.
- Control API with OpenAPI spec and services for planning, policy, metadata, connections, builds, and deployments.
- Edge agent and log gateway for running controlled jobs near customer systems.
- Operations, security, playbook, and architecture documentation.

## Tech Stack

- pnpm and Turborepo
- TypeScript services
- Next.js AI console
- Fastify/Node control API
- SQL-backed metadata model
- Odoo bridge add-ons
- Docker Compose infrastructure

## Getting Started

```bash
pnpm install
pnpm dev
```

## Quality Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Repository Notes

- Treat examples and policy files as development scaffolding until connected to a production control plane.
- Keep customer secrets, instance credentials, and deployment logs out of the repo.

## Contributing

Contributions are welcome. The best contributions are specific, tested, and grounded in the product mission. Good places to help include documentation, accessibility, tests, bug reports, UI polish, data validation, and safer AI behavior.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Security

Please do not open public issues for secrets, auth bypasses, data exposure, provider key leaks, or abuse vectors. Follow [SECURITY.md](SECURITY.md).

## Code of Conduct

This project follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Be direct, kind, and useful.

## License

MIT. See [LICENSE](LICENSE).
