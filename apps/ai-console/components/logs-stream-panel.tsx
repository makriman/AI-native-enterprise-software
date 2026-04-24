"use client";

import { useEffect, useMemo, useState } from "react";

type BuildOption = {
  id: string;
  title: string;
  status: string;
};

type StreamEvent = {
  type: string;
  timestamp?: string;
  message?: string;
};

const CONTROL_API_URL = process.env.NEXT_PUBLIC_CONTROL_API_URL || "";

export function LogsStreamPanel({ builds }: { builds: BuildOption[] }) {
  const [selectedBuildId, setSelectedBuildId] = useState<string>(builds[0]?.id ?? "");
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);

  const selectedBuild = useMemo(() => builds.find((build) => build.id === selectedBuildId), [builds, selectedBuildId]);

  useEffect(() => {
    if (!selectedBuildId) {
      return;
    }

    setEvents([]);
    setConnected(false);

    const source = new EventSource(`${CONTROL_API_URL}/api/v1/builds/${selectedBuildId}/stream`);

    source.onopen = () => {
      setConnected(true);
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as StreamEvent;
        setEvents((current) => [...current, payload].slice(-300));
      } catch {
        setEvents((current) => [...current, { type: "message", message: event.data }].slice(-300));
      }
    };

    source.onerror = () => {
      setConnected(false);
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [selectedBuildId]);

  if (!builds.length) {
    return (
      <article className="panel">
        <h3>Live Stream</h3>
        <p className="muted">No builds yet. Create a build first.</p>
      </article>
    );
  }

  return (
    <article className="panel">
      <h3>Live Stream</h3>
      <label>
        Build
        <select value={selectedBuildId} onChange={(event) => setSelectedBuildId(event.currentTarget.value)}>
          {builds.map((build) => (
            <option key={build.id} value={build.id}>
              {build.id} - {build.title}
            </option>
          ))}
        </select>
      </label>

      <p className="muted" style={{ marginTop: 8 }}>
        Status: {connected ? "connected" : "disconnected"}
        {selectedBuild ? ` | ${selectedBuild.status}` : ""}
      </p>

      <div
        style={{
          marginTop: 10,
          border: "1px solid var(--stroke)",
          borderRadius: 10,
          padding: 10,
          maxHeight: 420,
          overflow: "auto",
          background: "rgba(6, 16, 24, 0.55)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
          fontSize: 12
        }}
      >
        {events.map((event, idx) => (
          <div key={`${event.timestamp || "event"}-${idx}`} style={{ marginBottom: 6 }}>
            <span style={{ color: "var(--accent-2)" }}>{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : "--:--:--"}</span>
            {" "}
            <strong>{event.type}</strong>
            {event.message ? `: ${event.message}` : ""}
          </div>
        ))}
        {!events.length ? <p className="muted">Waiting for events...</p> : null}
      </div>
    </article>
  );
}
