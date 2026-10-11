"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  Filter,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import useApi from "@/hooks/useApi";
import EvidenceGraph from "@/components/EvidenceGraph";
import { Badge, Empty, ErrorBox, Loading } from "@/components/Status";

import "./evidence-graph.css";

const CLASSES = [
  "demonstrated",
  "self-reported",
  "insufficient",
  "outdated",
];

const HELP = {
  demonstrated:
    "Two or more recorded results, the newest within 90 days, and performance at Developing or higher.",
  "self-reported":
    "You reported this skill, but no SkillSetra activity backs it yet.",
  insufficient:
    "There is not enough supporting evidence yet. This does not mean you lack the skill.",
  outdated:
    "Your newest result is older than 90 days. A short re-test can refresh the evidence.",
};

const LEVEL = [
  "No evidence",
  "Limited",
  "Developing",
  "Demonstrated",
];

const STATUS_COLORS = {
  demonstrated: "#18794e",
  "self-reported": "#b45309",
  insufficient: "#687c70",
  outdated: "#b93827",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getLevel(level) {
  return LEVEL[level] ?? "Not specified";
}

function StatusDot({ state }) {
  const status = CLASSES.includes(state) ? state : "insufficient";

  return (
    <span className="eg-status">
      <span
        className="eg-status-dot"
        style={{ "--eg-status-color": STATUS_COLORS[status] }}
      />
      <span>{status.replaceAll("-", " ")}</span>
    </span>
  );
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="eg-stat-card">
      <div className="eg-stat-top">
        <span className="eg-stat-icon">
          <Icon size={19} />
        </span>
        <span className="eg-stat-label">{label}</span>
      </div>

      <div className="eg-stat-value">{value}</div>

      <p className="eg-stat-detail">{detail}</p>
    </article>
  );
}

function Detail({ s }) {
  const evidence = Array.isArray(s.evidence) ? s.evidence : [];

  const sourceCounts = useMemo(() => {
    return evidence.reduce((result, item) => {
      const label = item.source_label || item.source || "Other";
      result[label] = (result[label] || 0) + 1;
      return result;
    }, {});
  }, [evidence]);

  const latest = [...evidence].sort((a, b) => {
    const first = new Date(a.when || 0).getTime();
    const second = new Date(b.when || 0).getTime();

    return second - first;
  })[0];

  const confidenceValues = evidence
    .map((item) => item.confidence)
    .filter((value) => value != null && Number.isFinite(Number(value)))
    .map(Number);

  const averageConfidence = confidenceValues.length
    ? Math.round(
        (confidenceValues.reduce((sum, value) => sum + value, 0) /
          confidenceValues.length) *
          100
      )
    : null;

  return (
    <section className="eg-detail">
      <div className="eg-detail-header">
        <div className="eg-detail-title-wrap">
          <div className="eg-detail-skill-icon">
            <Target size={21} />
          </div>

          <div className="eg-detail-title">
            <span className="eg-eyebrow">SELECTED SKILL</span>
            <h3>{s.key}</h3>
          </div>
        </div>

        <Badge state={s.state} />
      </div>

      <div className="eg-detail-status-row">
        <StatusDot state={s.klass} />
        <span className="eg-evidence-total">
          {evidence.length} result{evidence.length === 1 ? "" : "s"}
        </span>
      </div>

      <p className="eg-detail-description">
        {HELP[s.klass] || HELP.insufficient}
      </p>

      <div className="eg-detail-metrics">
        <div className="eg-detail-metric">
          <span>Evidence items</span>
          <strong>{evidence.length}</strong>
        </div>

        <div className="eg-detail-metric">
          <span>Avg. confidence</span>
          <strong>
            {averageConfidence == null ? "—" : `${averageConfidence}%`}
          </strong>
        </div>

        <div className="eg-detail-metric">
          <span>Latest activity</span>
          <strong className="eg-date-value">
            {latest ? formatDate(latest.when) : "—"}
          </strong>
        </div>
      </div>

      <div className="eg-section-heading">
        <h4>Evidence sources</h4>
        <span>{Object.keys(sourceCounts).length} sources</span>
      </div>

      {Object.keys(sourceCounts).length > 0 ? (
        <div className="eg-source-breakdown">
          {Object.entries(sourceCounts).map(([name, count]) => {
            const percent = Math.round((count / evidence.length) * 100);

            return (
              <div className="eg-source-item" key={name}>
                <div className="eg-source-item-label">
                  <span>{name}</span>
                  <span>{count}</span>
                </div>

                <div
                  className="eg-progress-track"
                  role="progressbar"
                  aria-label={`${name} evidence`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                >
                  <div
                    className="eg-progress-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="eg-muted-note">
          No source breakdown is available for this skill.
        </p>
      )}

      <div className="eg-section-heading eg-records-heading">
        <h4>Supporting evidence</h4>
        <span>{evidence.length} records</span>
      </div>

      {evidence.length > 0 ? (
        <div className="eg-record-list">
          {evidence.map((item, index) => (
            <article
              className="eg-record"
              key={item.id ?? `${item.source}-${item.when}-${index}`}
            >
              <div className="eg-record-icon">
                <FileCheck2 size={17} />
              </div>

              <div className="eg-record-content">
                <div className="eg-record-heading">
                  <strong>
                    {item.source_label || item.source || "Recorded activity"}
                  </strong>

                  {item.claim && (
                    <span className="eg-unverified">Unverified</span>
                  )}
                </div>

                <p>{item.summary || "Evidence recorded for this skill."}</p>

                <div className="eg-record-meta">
                  <span>{formatDate(item.when)}</span>
                  <span>·</span>
                  <span>{getLevel(item.level)}</span>

                  {item.confidence != null && (
                    <>
                      <span>·</span>
                      <span>
                        {Math.round(Number(item.confidence) * 100)}% confidence
                      </span>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="eg-no-records">
          <ShieldCheck size={19} />
          <div>
            <strong>No individual records found</strong>
            <p>
              This skill has no supporting evidence items available in the
              current response.
            </p>
          </div>
        </div>
      )}

      <Link
        className="eg-retest-link"
        href={`/assessment?skill=${encodeURIComponent(s.key)}`}
      >
        Refresh this skill with a re-test
        <ArrowRight size={16} />
      </Link>

      <div className="eg-disclaimer">
        <ShieldCheck size={15} />
        Evidence indicators are directional, not formal certification.
      </div>
    </section>
  );
}

export default function EvidenceGraphPage() {
  const { data, error, loading, reload } = useApi("/evidence-graph");

  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [klass, setKlass] = useState("");
  const [days, setDays] = useState(0);
  const [view, setView] = useState("graph");
  const [selected, setSelected] = useState(null);

  const allSkills = Array.isArray(data?.skills) ? data.skills : [];
  const allSources = Array.isArray(data?.sources) ? data.sources : [];

  const skills = useMemo(() => {
    const cutoff = days
      ? Date.now() - days * 24 * 60 * 60 * 1000
      : 0;

    return allSkills
      .filter((skill) => {
        const name = String(skill.key || "").toLowerCase();
        const query = q.trim().toLowerCase();

        return (
          (!query || name.includes(query)) &&
          (!klass || skill.klass === klass)
        );
      })
      .map((skill) => {
        const evidence = (Array.isArray(skill.evidence) ? skill.evidence : [])
          .filter((item) => {
            const matchesSource = !source || item.source === source;

            const timestamp = item.when
              ? new Date(item.when).getTime()
              : 0;

            const matchesPeriod = !cutoff || timestamp >= cutoff;

            return matchesSource && matchesPeriod;
          });

        return { ...skill, evidence };
      })
      .filter((skill) => skill.evidence.length > 0);
  }, [allSkills, q, source, klass, days]);

  const selectedSkill = skills.find((skill) => skill.key === selected) || null;

  const stats = useMemo(() => {
    const demonstrated = allSkills.filter(
      (skill) => skill.klass === "demonstrated"
    ).length;

    const totalEvidence = allSkills.reduce(
      (total, skill) =>
        total + (Array.isArray(skill.evidence) ? skill.evidence.length : 0),
      0
    );

    return {
      skills: allSkills.length,
      evidence: totalEvidence,
      demonstrated,
      percentage: allSkills.length
        ? Math.round((demonstrated / allSkills.length) * 100)
        : 0,
    };
  }, [allSkills]);

  const reset = () => {
    setQ("");
    setSource("");
    setKlass("");
    setDays(0);
    setSelected(null);
  };

  if (loading) {
    return <Loading label="Building your evidence graph" />;
  }

  if (error) {
    return <ErrorBox message={error} onRetry={reload} />;
  }

  return (
    <main className="eg-page">
      <header className="eg-page-header">
        <div className="eg-heading-copy">
          <div className="eg-breadcrumb">
            <span>Insights</span>
            <span>/</span>
            <span className="eg-breadcrumb-current">Evidence Graph</span>
          </div>

          <div className="eg-title-row">
            <div className="eg-page-icon">
              <Network size={24} />
            </div>

            <div>
              <h1>Skill Evidence Graph</h1>
              <p>
                Trace every skill to the activity and results that support it.
              </p>
            </div>
          </div>
        </div>

        <div className="eg-live-indicator">
          <span />
          Evidence-backed insights
        </div>
      </header>

      {allSkills.length === 0 ? (
        <div className="eg-first-empty">
          <div className="eg-empty-icon">
            <Sparkles size={25} />
          </div>

          <Empty title="Your evidence graph starts here">
            Complete an assessment or challenge to start connecting your
            skills to real activity.
            <div className="eg-empty-action">
              <Link className="eg-primary-link" href="/assessment">
                Start assessment
                <ArrowRight size={16} />
              </Link>
            </div>
          </Empty>
        </div>
      ) : (
        <>
          <section className="eg-stats-grid" aria-label="Evidence overview">
            <StatCard
              icon={Network}
              label="Tracked skills"
              value={stats.skills}
              detail="Skills in your evidence profile"
            />

            <StatCard
              icon={FileCheck2}
              label="Evidence items"
              value={stats.evidence}
              detail="Recorded results across your skills"
            />

            <StatCard
              icon={CheckCircle2}
              label="Demonstrated"
              value={`${stats.percentage}%`}
              detail={`${stats.demonstrated} skills marked demonstrated`}
            />
          </section>

          <section className="eg-filter-panel">
            <div className="eg-filter-header">
              <div>
                <h2>Explore your evidence</h2>
                <p>
                  Search skills and narrow results by source, status, or period.
                </p>
              </div>

              <button
                type="button"
                className="eg-reset-button"
                onClick={reset}
              >
                <Filter size={15} />
                Reset filters
              </button>
            </div>

            <div className="eg-filters-grid">
              <label className="eg-filter-field">
                <span>Search skills</span>

                <div className="eg-search-control">
                  <Search size={17} />

                  <input
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="For example: Python"
                    aria-label="Search skills"
                  />

                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </label>

              <label className="eg-filter-field">
                <span>Source</span>

                <div className="eg-select-control">
                  <select
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                  >
                    <option value="">All sources</option>
                    {allSources.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label} ({item.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </label>

              <label className="eg-filter-field">
                <span>Evidence status</span>

                <div className="eg-select-control">
                  <select
                    value={klass}
                    onChange={(event) => setKlass(event.target.value)}
                  >
                    <option value="">All statuses</option>
                    {CLASSES.map((item) => (
                      <option key={item} value={item}>
                        {item.replaceAll("-", " ")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </label>

              <label className="eg-filter-field">
                <span>Period</span>

                <div className="eg-select-control">
                  <select
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                  >
                    <option value={0}>All time</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={365}>Last year</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </label>
            </div>
          </section>

          <section className="eg-workspace">
            <div className="eg-toolbar">
              <div className="eg-legend">
                {CLASSES.map((item) => (
                  <span key={item} className="eg-legend-item">
                    <span
                      className="eg-status-dot"
                      style={{
                        "--eg-status-color": STATUS_COLORS[item],
                      }}
                    />
                    {item.replaceAll("-", " ")}
                  </span>
                ))}
              </div>

              <div className="eg-view-switch" aria-label="Evidence view">
                <button
                  type="button"
                  className={view === "graph" ? "active" : ""}
                  aria-pressed={view === "graph"}
                  onClick={() => setView("graph")}
                >
                  <Network size={16} />
                  Graph
                </button>

                <button
                  type="button"
                  className={view === "list" ? "active" : ""}
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <Activity size={16} />
                  List
                </button>
              </div>
            </div>

            {skills.length === 0 ? (
              <div className="eg-empty-results">
                <div className="eg-empty-icon">
                  <Search size={22} />
                </div>

                <h3>No matching skills</h3>
                <p>
                  Try another search term or remove some filters to see more
                  evidence.
                </p>

                <button
                  type="button"
                  className="eg-primary-button"
                  onClick={reset}
                >
                  Clear filters
                </button>
              </div>
            ) : view === "graph" ? (
              <div className="eg-workspace-grid">
                <section className="eg-graph-card">
                  <div className="eg-card-header">
                    <div>
                      <h2>Evidence connections</h2>
                      <p>
                        {skills.length} skills · Select a node to inspect it
                      </p>
                    </div>

                    <span className="eg-interactive-label">
                      <Activity size={14} />
                      Interactive
                    </span>
                  </div>

                  <div className="eg-graph-content">
                    <EvidenceGraph
                      skills={skills}
                      selected={selectedSkill?.key || selected}
                      onSelect={setSelected}
                    />
                  </div>

                  <div className="eg-graph-footer">
                    <span>
                      <span
                        className="eg-status-dot"
                        style={{ "--eg-status-color": "#18794e" }}
                      />
                      Node colors indicate evidence status
                    </span>

                    <span>{skills.length} visible skills</span>
                  </div>
                </section>

                <aside className="eg-detail-card">
                  {selectedSkill ? (
                    <Detail s={selectedSkill} />
                  ) : (
                    <div className="eg-detail-empty">
                      <div className="eg-empty-icon">
                        <Target size={24} />
                      </div>

                      <h3>Explore a skill</h3>

                      <p>
                        Select a node in the graph to see its supporting
                        evidence, source breakdown, confidence, and latest
                        activity.
                      </p>

                      <div className="eg-hint">
                        <Sparkles size={15} />
                        Follow the connections from source to skill.
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            ) : (
              <section className="eg-list-card">
                <div className="eg-card-header">
                  <div>
                    <h2>Skills and supporting evidence</h2>
                    <p>Expand a skill to review its individual records.</p>
                  </div>

                  <span className="eg-result-count">
                    {skills.length} results
                  </span>
                </div>

                <div className="eg-skill-list">
                  {skills.map((skill) => {
                    const isSelected = selected === skill.key;

                    return (
                      <article className="eg-skill-item" key={skill.key}>
                        <button
                          type="button"
                          className="eg-skill-toggle"
                          aria-expanded={isSelected}
                          onClick={() =>
                            setSelected(isSelected ? null : skill.key)
                          }
                        >
                          <span className="eg-skill-icon">
                            <Target size={18} />
                          </span>

                          <span className="eg-skill-name">
                            <strong>{skill.key}</strong>
                            <span>
                              {skill.evidence.length} result
                              {skill.evidence.length === 1 ? "" : "s"}
                            </span>
                          </span>

                          <StatusDot state={skill.klass} />

                          <ChevronDown
                            size={17}
                            className={
                              isSelected ? "eg-chevron-open" : ""
                            }
                          />
                        </button>

                        {isSelected && (
                          <div className="eg-expanded-detail">
                            <Detail s={skill} />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </section>

          <footer className="eg-page-footer">
            <Clock3 size={15} />
            <span>
              Skill evidence reflects recorded activity. Insufficient or
              outdated evidence is not proof that you lack a skill.
            </span>
          </footer>
        </>
      )}
    </main>
  );
}
