# Service Map

```text
User Browser
  -> AI Console
     -> Control API
        -> Planner / Spec Compiler
        -> Policy Engine
        -> Runner Supervisor
           -> Managed Runner
           -> Edge Runner Agent
        -> Deployment Orchestrator
        -> Artifact Store
        -> Log Gateway
        -> Audit Store

Odoo Instance(s)
  <- Odoo AI Bridge
  -> Odoo Adapter Snapshot Export
```
