"use client";

import { useState } from "react";
import type { WeatherHistoryRecord } from "@/lib/types";

type HistoryListProps = {
  records: WeatherHistoryRecord[];
  isLoading: boolean;
  onSelect: (record: WeatherHistoryRecord) => void;
  onRefresh: () => void;
  onError: (message: string) => void;
};

export function HistoryList({
  records,
  isLoading,
  onSelect,
  onRefresh,
  onError
}: HistoryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLocation, setDraftLocation] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function startEdit(record: WeatherHistoryRecord) {
    setEditingId(record.id);
    setDraftLocation(record.location);
  }

  async function updateRecord(id: string) {
    setBusyId(id);
    onError("");

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: draftLocation })
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to update record.");
      }

      setEditingId(null);
      onRefresh();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to update record.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRecord(id: string) {
    setBusyId(id);
    onError("");

    try {
      const response = await fetch(`/api/history/${id}`, { method: "DELETE" });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to delete record.");
      }

      onRefresh();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to delete record.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel" aria-labelledby="history-title">
      <div className="panel-header">
        <h2 id="history-title">History</h2>
        <div className="header-actions">
          <a className="button secondary link-button" href="/api/history/export">
            Export CSV
          </a>
          <button
            className="button secondary"
            disabled={isLoading}
            onClick={onRefresh}
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="panel-body">
        {isLoading && <div className="empty">Loading history...</div>}

        {!isLoading && records.length === 0 && (
          <div className="empty">Saved weather queries will appear here.</div>
        )}

        {!isLoading && records.length > 0 && (
          <div className="history-list">
            {records.map((record) => (
              <article className="history-item" key={record.id}>
                {editingId === record.id ? (
                  <div className="field">
                    <label htmlFor={`location-${record.id}`}>Location</label>
                    <input
                      id={`location-${record.id}`}
                      value={draftLocation}
                      onChange={(event) => setDraftLocation(event.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <h3>{record.location}</h3>
                    <div className="history-meta">{formatDate(record.queried_at)}</div>
                  </>
                )}

                <div className="history-actions">
                  <button className="button secondary" onClick={() => onSelect(record)} type="button">
                    View
                  </button>
                  {editingId === record.id ? (
                    <>
                      <button
                        className="button"
                        disabled={busyId === record.id}
                        onClick={() => updateRecord(record.id)}
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => setEditingId(null)}
                        type="button"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="button secondary"
                      onClick={() => startEdit(record)}
                      type="button"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    className="button danger"
                    disabled={busyId === record.id}
                    onClick={() => deleteRecord(record.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
