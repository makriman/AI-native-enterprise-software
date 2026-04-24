"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

const CONTROL_API_URL = process.env.NEXT_PUBLIC_CONTROL_API_URL || "";

export function BuildComposerForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      workspace_id: form.get("workspace_id"),
      instance_id: form.get("instance_id"),
      title: form.get("title"),
      prompt: form.get("prompt"),
      attachments: [],
      execution_mode: form.get("execution_mode"),
      deployment_path: ["sandbox", "staging", "production"],
      risk_tolerance: form.get("risk_tolerance"),
      auto_deploy_sandbox: true
    };

    try {
      const response = await fetch(`${CONTROL_API_URL}/api/v1/builds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const json = (await response.json()) as { build_id: string; status: string };
      setResult(`Build ${json.build_id} created with status ${json.status}. Redirecting to build detail...`);
      event.currentTarget.reset();
      router.push(`/builds/${json.build_id}`);
      router.refresh();
    } catch (submitError) {
      setError(String(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="build-form panel" onSubmit={onSubmit}>
      <h3>New Build Request</h3>
      <label>
        Workspace ID
        <input name="workspace_id" defaultValue="ws_default" required />
      </label>
      <label>
        Instance ID
        <input name="instance_id" defaultValue="inst_default" required />
      </label>
      <label>
        Title
        <input name="title" defaultValue="Partner onboarding workflow" required />
      </label>
      <label>
        Implementation Prompt
        <textarea
          name="prompt"
          rows={5}
          defaultValue="Build a partner onboarding workflow with approval routing, document collection, portal upload, SLA reminders, and overdue dashboard."
          required
        />
      </label>
      <label>
        Execution Mode
        <select name="execution_mode" defaultValue="managed_api">
          <option value="managed_api">Managed API</option>
          <option value="chatgpt_edge">Connect ChatGPT (Edge Agent)</option>
        </select>
      </label>
      <label>
        Risk Tolerance
        <select name="risk_tolerance" defaultValue="medium">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </label>
      <button className="primary" type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Create Build"}
      </button>
      {result ? <p>{result}</p> : null}
      {error ? <p className="muted">{error}</p> : null}
    </form>
  );
}
