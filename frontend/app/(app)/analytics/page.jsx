
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Download,
  FileSearch,
  RefreshCw,
  Target,
  TrendingUp,
  Mic,
} from "lucide-react";

import { api } from "@/lib/api";
import BrandLoader from "@/components/BrandLoader";

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
  { label: "365 days", value: 365 },
];

const CATEGORIES = [
  { label: "All activity", value: "all" },
  { label: "Assessments", value: "assessment" },
  { label: "Practice", value: "practice" },
  { label: "Learning", value: "learning" },
  { label: "Interviews", value: "interview" },
  { label: "Jobs", value: "job" },
  { label: "Resume", value: "resume" },
  { label: "Navigation", value: "navigation" },
  { label: "Other", value: "other" },
];

const CATEGORY_COLORS = {
  assessment: "#0d9488",
  assessments: "#0d9488",
  practice: "#6366f1",
  learning: "#16a34a",
  interview: "#d97706",
  interviews: "#d97706",
  job: "#2563eb",
  jobs: "#2563eb",
  resume: "#9333ea",
  navigation: "#64748b",
  other: "#64748b",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value) {
  return String(value || "Other")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function downloadCSV(events) {
  const columns = ["title", "category", "description", "created_at"];

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };

  const rows = [
    columns.join(","),
    ...events.map((event) =>
      columns.map((column) => escapeCSV(event[column])).join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "skillsetra-analytics.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function MetricCard({ label, value, detail, Icon }) {
  return (
    <div className="card" style={{ minWidth: 0 }}>
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span className="small muted">{label}</span>
        <Icon size={19} aria-hidden color="var(--teal)" />
      </div>

      <div
        className="num"
        style={{ fontSize: "clamp(24px, 3vw, 34px)", marginTop: 10 }}
      >
        {value}
      </div>

      <div className="small muted" style={{ marginTop: 5 }}>
        {detail}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [category, setCategory] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const result = await api(`/analytics?days=${days}`);

        if (!result || typeof result !== "object") {
          throw new Error("The analytics API returned an invalid response.");
        }

        setData(result);
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load analytics. Check your backend connection."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days]
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const allEvents = useMemo(
    () => (Array.isArray(data?.events) ? data.events : []),
    [data]
  );

  const visibleEvents = useMemo(() => {
    if (category === "all") return allEvents;

    return allEvents.filter(
      (event) =>
        String(event.category || "other").toLowerCase() === category
    );
  }, [allEvents, category]);

  const summary = data?.summary || {};

  const daily = useMemo(
    () => (Array.isArray(data?.daily) ? data.daily : []),
    [data]
  );

  const categoryStats = useMemo(
    () => (Array.isArray(data?.categories) ? data.categories : []),
    [data]
  );

  const maxDaily = Math.max(
    1,
    ...daily.map((item) => Number(item.count || 0))
  );

  const maxCategory = Math.max(
    1,
    ...categoryStats.map((item) => Number(item.count || 0))
  );

  if (loading) {
    return <BrandLoader label="Loading your analytics" />;
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div className="eyebrow">YOUR PERFORMANCE</div>
          <h1 style={{ margin: "6px 0" }}>Analytics</h1>
          <p className="muted" style={{ margin: 0 }}>
            Monitor your learning, assessments, practice, and career activity.
          </p>
        </div>

        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            className="btn"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              aria-hidden
              style={{
                marginRight: 6,
                verticalAlign: "middle",
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            Refresh
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={() => downloadCSV(visibleEvents)}
            disabled={visibleEvents.length === 0}
          >
            <Download
              size={16}
              aria-hidden
              style={{ marginRight: 6, verticalAlign: "middle" }}
            />
            Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <div className="card" role="alert">
          <p style={{ color: "var(--danger, #ef4444)", marginTop: 0 }}>
            {error}
          </p>

          <button
            className="btn"
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
          >
            Try again
          </button>
        </div>
      ) : null}

      <div
        className="row"
        style={{
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          {RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              className={`btn ${days === range.value ? "primary" : ""}`}
              onClick={() => setDays(range.value)}
              aria-pressed={days === range.value}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div>
          <label className="small muted" htmlFor="analytics-category">
            Filter activity
          </label>
          <select
            id="analytics-category"
            className="input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={{ display: "block", minWidth: 170, marginTop: 5 }}
          >
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="kpis">
        <MetricCard
          label="Recorded activities"
          value={summary.total_activities ?? allEvents.length}
          detail={`Within the last ${days} days`}
          Icon={Activity}
        />

        <MetricCard
          label="Assessments"
          value={summary.assessments ?? 0}
          detail={
            summary.assessment_average != null
              ? `Average score: ${summary.assessment_average}%`
              : "Assessment records found"
          }
          Icon={Target}
        />

        <MetricCard
          label="Practice attempts"
          value={summary.practice_attempts ?? 0}
          detail="Recorded practice activity"
          Icon={CheckCircle2}
        />

        <MetricCard
          label="Interviews"
          value={summary.interviews ?? 0}
          detail="Recorded interview sessions"
          Icon={Mic}
        />
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="row" style={{ alignItems: "center", gap: 10 }}>
            <TrendingUp size={20} color="var(--teal)" aria-hidden />
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Activity over time</h2>
              <p className="small muted" style={{ margin: "4px 0 0" }}>
                Recorded activities per day
              </p>
            </div>
          </div>

          {daily.length === 0 ? (
            <p className="muted" style={{ marginTop: 22 }}>
              No dated activity records are available for this period.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 5,
                height: 190,
                marginTop: 28,
                overflowX: "auto",
                paddingBottom: 8,
              }}
              aria-label="Daily activity bar chart"
            >
              {daily.map((item, index) => {
                const count = Number(item.count || 0);
                const height = Math.max(4, (count / maxDaily) * 145);

                return (
                  <div
                    key={item.date || index}
                    title={`${formatDate(item.date)}: ${count} activities`}
                    style={{
                      flex: "1 0 8px",
                      minWidth: 7,
                      maxWidth: 28,
                      height: `${height}px`,
                      background: "var(--teal)",
                      opacity: count ? 0.9 : 0.16,
                      borderRadius: "5px 5px 2px 2px",
                    }}
                  />
                );
              })}
            </div>
          )}

          <div
            className="row small muted"
            style={{ justifyContent: "space-between", marginTop: 8 }}
          >
            <span>{formatDate(daily[0]?.date)}</span>
            <span>{formatDate(daily[daily.length - 1]?.date)}</span>
          </div>
        </section>

        <section className="card">
          <div className="row" style={{ alignItems: "center", gap: 10 }}>
            <BarChart3 size={20} color="var(--teal)" aria-hidden />
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Activity breakdown</h2>
              <p className="small muted" style={{ margin: "4px 0 0" }}>
                Distribution by activity category
              </p>
            </div>
          </div>

          {categoryStats.length === 0 ? (
            <p className="muted" style={{ marginTop: 22 }}>
              No category data is available yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 17, marginTop: 24 }}>
              {categoryStats.map((item, index) => {
                const count = Number(item.count || 0);
                const name = String(
                  item.category || item.label || "other"
                ).toLowerCase();

                return (
                  <div key={`${name}-${index}`}>
                    <div
                      className="row small"
                      style={{
                        justifyContent: "space-between",
                        marginBottom: 7,
                      }}
                    >
                      <span>{titleCase(name)}</span>
                      <strong>{count}</strong>
                    </div>

                    <div
                      style={{
                        height: 8,
                        background: "var(--line, #e5e7eb)",
                        borderRadius: 20,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(count / maxCategory) * 100}%`,
                          height: "100%",
                          background:
                            CATEGORY_COLORS[name] || "var(--teal)",
                          borderRadius: 20,
                          transition: "width 250ms ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="row" style={{ alignItems: "center", gap: 10 }}>
            <BookOpen size={20} color="var(--teal)" aria-hidden />
            <h2 style={{ margin: 0, fontSize: 18 }}>Learning progress</h2>
          </div>

          <div className="num" style={{ marginTop: 16 }}>
            {summary.learning_completion_pct != null
              ? `${Math.round(Number(summary.learning_completion_pct))}%`
              : "—"}
          </div>

          <p className="small muted">
            Completion rate based on learning progress records available to
            the analytics API.
          </p>

          <div
            style={{
              height: 10,
              borderRadius: 20,
              background: "var(--line, #e5e7eb)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.max(
                  0,
                  Math.min(100, Number(summary.learning_completion_pct || 0))
                )}%`,
                background: "var(--teal)",
                borderRadius: 20,
              }}
            />
          </div>
        </section>

        <section className="card">
          <div className="row" style={{ alignItems: "center", gap: 10 }}>
            <BriefcaseBusiness size={20} color="var(--teal)" aria-hidden />
            <h2 style={{ margin: 0, fontSize: 18 }}>Career activity</h2>
          </div>

          <div className="grid g2" style={{ marginTop: 18 }}>
            <div>
              <div className="small muted">Saved jobs</div>
              <div className="num">{summary.saved_jobs ?? 0}</div>
            </div>

            <div>
              <div className="small muted">Job analyses</div>
              <div className="num">{summary.job_analyses ?? 0}</div>
            </div>

            <div>
              <div className="small muted">Resume analyses</div>
              <div className="num">{summary.resume_analyses ?? 0}</div>
            </div>

            <div>
              <div className="small muted">Activity period</div>
              <div style={{ marginTop: 8, fontWeight: 600 }}>
                {data?.range?.start || data?.range_start
                  ? formatDate(data.range?.start || data.range_start)
                  : `${days} days`}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 19 }}>Activity history</h2>
            <p className="small muted" style={{ margin: "5px 0 0" }}>
              {visibleEvents.length} displayed records
            </p>
          </div>

          <Clock3 size={20} color="var(--teal)" aria-hidden />
        </div>

        {visibleEvents.length === 0 ? (
          <div style={{ padding: "28px 0" }}>
            <p className="muted">
              No activity matches this filter. Try a different category or
              date range.
            </p>
            <Link className="btn" href="/dashboard">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  {["Activity", "Category", "Details", "Date"].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid var(--line, #e5e7eb)",
                          fontSize: 12,
                          color: "var(--muted, #6b7280)",
                          fontWeight: 600,
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {visibleEvents.map((event, index) => {
                  const eventCategory = String(
                    event.category || "other"
                  ).toLowerCase();

                  return (
                    <tr key={event.id || `${event.title}-${index}`}>
                      <td
                        style={{
                          padding: "13px 10px",
                          borderBottom: "1px solid var(--line, #e5e7eb)",
                          fontWeight: 600,
                          minWidth: 150,
                        }}
                      >
                        {event.title || "Activity"}
                      </td>

                      <td
                        style={{
                          padding: "13px 10px",
                          borderBottom: "1px solid var(--line, #e5e7eb)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          className="badge none"
                          style={{
                            borderLeft: `3px solid ${
                              CATEGORY_COLORS[eventCategory] || "#64748b"
                            }`,
                            paddingLeft: 8,
                          }}
                        >
                          {titleCase(eventCategory)}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "13px 10px",
                          borderBottom: "1px solid var(--line, #e5e7eb)",
                          minWidth: 160,
                        }}
                      >
                        <span className="small muted">
                          {event.description || "—"}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "13px 10px",
                          borderBottom: "1px solid var(--line, #e5e7eb)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span className="small">
                          {formatDateTime(
                            event.created_at || event.timestamp || event.date
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Continue your journey</h2>

        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <Link className="btn" href="/assessment">
            <Target
              size={16}
              aria-hidden
              style={{ marginRight: 6, verticalAlign: "middle" }}
            />
            Take assessment
          </Link>

          <Link className="btn" href="/resources">
            <BookOpen
              size={16}
              aria-hidden
              style={{ marginRight: 6, verticalAlign: "middle" }}
            />
            Explore learning
          </Link>

          <Link className="btn" href="/jobs">
            <BriefcaseBusiness
              size={16}
              aria-hidden
              style={{ marginRight: 6, verticalAlign: "middle" }}
            />
            Explore jobs
          </Link>

          <Link className="btn" href="/resume-analysis">
            <FileSearch
              size={16}
              aria-hidden
              style={{ marginRight: 6, verticalAlign: "middle" }}
            />
            Resume analysis
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
