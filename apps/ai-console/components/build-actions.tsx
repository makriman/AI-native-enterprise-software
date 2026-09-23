"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BuildActionsProps = {
  buildId: string;
  status: string;
  deploymentPath: string[];
};

async function postJson(path: string, payload?: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: payload ? JSON.stringify(payload) : undefined
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export function BuildActions({ buildId, status, deploymentPath }: BuildActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(key: string, action: () => Promise<unknown>, successMessage: string) {
    setBusy(key);
    setError(null);
    setMessage(null);

    try {
      await action();
      setMessage(successMessage);
      router.refresh();
    } catch (actionError) {
      setError(String(actionError));
    } finally {
      setBusy(null);
    }
  }

  const canApprove = ["awaiting_approval", "awaiting_scope_review"].includes(status);
  const canDeploySandbox = deploymentPath.includes("sandbox") && ["approved", "awaiting_approval"].includes(status);

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <h3>Actions</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className="primary"
          type="button"
          disabled={!canApprove || busy !== null}
          onClick={() =>
            runAction(
              "approve",
              () => postJson(`/console/control/builds/${buildId}/approve`, {}),
              "Build approved."
            )
          }
        >
          {busy === "approve" ? "Approving..." : "Approve Build"}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            runAction(
              "request_changes",
              () =>
                postJson(`/console/control/builds/${buildId}/request-changes`, {
                  comment: "Needs scope revision"
                }),
              "Build moved back to scope review."
            )
          }
        >
          {busy === "request_changes" ? "Requesting..." : "Request Changes"}
        </button>

        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            runAction(
              "reject",
              () =>
                postJson(`/console/control/builds/${buildId}/reject`, {
                  comment: "Rejected from UI"
                }),
              "Build rejected."
            )
          }
        >
          {busy === "reject" ? "Rejecting..." : "Reject Build"}
        </button>

        <button
          type="button"
          disabled={!canDeploySandbox || busy !== null}
          onClick={() =>
            runAction(
              "deploy_sandbox",
              () =>
                postJson(`/console/control/builds/${buildId}/deploy`, {
                  target_environment: "sandbox",
                  approved_snapshot_id: `snap_${buildId}`,
                  strategy: "rolling",
                  require_backup: true
                }),
              "Sandbox deployment succeeded."
            )
          }
        >
          {busy === "deploy_sandbox" ? "Deploying..." : "Deploy to Sandbox"}
        </button>
      </div>

      {message ? <p>{message}</p> : null}
      {error ? <p className="muted">{error}</p> : null}
    </div>
  );
}
