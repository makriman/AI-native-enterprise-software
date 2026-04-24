import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

interface AgentConfig {
  controlApiUrl: string;
  workspaceId: string;
  agentName: string;
  token: string;
  hostName: string;
  pollIntervalMs: number;
  workRoot: string;
}

function loadConfig(): AgentConfig {
  return {
    controlApiUrl: process.env.CONTROL_API_URL || "http://localhost:4000",
    workspaceId: process.env.WORKSPACE_ID || "ws_default",
    agentName: process.env.AGENT_NAME || "edge-agent-local",
    token: process.env.AGENT_TOKEN || "dev-edge-token",
    hostName: process.env.HOSTNAME || "local-host",
    pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 10000),
    workRoot: process.env.EDGE_AGENT_WORKROOT || "/tmp/oae-edge-agent"
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

async function registerAgent(config: AgentConfig): Promise<{ agent_id: string; status: string }> {
  return postJson(`${config.controlApiUrl}/api/v1/connections/edge-agent/register`, {
    workspace_id: config.workspaceId,
    name: config.agentName,
    host: config.hostName,
    token: config.token
  });
}

async function heartbeat(config: AgentConfig, agentId: string, status: "online" | "busy"): Promise<void> {
  await postJson(`${config.controlApiUrl}/api/v1/connections/edge-agent/heartbeat`, {
    workspace_id: config.workspaceId,
    agent_id: agentId,
    status
  });
}

async function pollJob(config: AgentConfig, agentId: string): Promise<{ id: string; build_id: string; spec_json: unknown } | null> {
  const url = new URL(`${config.controlApiUrl}/api/v1/edge/jobs/next`);
  url.searchParams.set("workspace_id", config.workspaceId);
  url.searchParams.set("agent_id", agentId);

  const response = await fetch(url);
  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`poll failed ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as { id: string; build_id: string; spec_json: unknown };
}

async function completeJob(config: AgentConfig, jobId: string, payload: Record<string, unknown>): Promise<void> {
  await postJson(`${config.controlApiUrl}/api/v1/edge/jobs/${jobId}/complete`, payload);
}

async function executeJob(config: AgentConfig, job: { id: string; build_id: string; spec_json: unknown }): Promise<void> {
  const jobDir = path.join(config.workRoot, job.id);
  await mkdir(jobDir, { recursive: true });

  const transcriptPath = path.join(jobDir, "edge-run-transcript.txt");
  const specPath = path.join(jobDir, "spec.json");

  await writeFile(specPath, JSON.stringify(job.spec_json, null, 2), "utf8");
  await writeFile(
    transcriptPath,
    [
      `job_id=${job.id}`,
      `build_id=${job.build_id}`,
      "mode=chatgpt_edge",
      "status=completed",
      `timestamp=${new Date().toISOString()}`
    ].join("\n"),
    "utf8"
  );

  await completeJob(config, job.id, {
    status: "succeeded",
    artifact_paths: [transcriptPath, specPath],
    notes: "Edge agent executed placeholder local run."
  });
}

async function main(): Promise<void> {
  const config = loadConfig();
  await mkdir(config.workRoot, { recursive: true });

  const registration = await registerAgent(config);
  const agentId = registration.agent_id;

  // eslint-disable-next-line no-console
  console.log(`[edge-agent] registered as ${agentId}`);

  while (true) {
    try {
      await heartbeat(config, agentId, "online");
      const job = await pollJob(config, agentId);
      if (job) {
        await heartbeat(config, agentId, "busy");
        await executeJob(config, job);
        await heartbeat(config, agentId, "online");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[edge-agent] ${String(error)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }
}

void main();
