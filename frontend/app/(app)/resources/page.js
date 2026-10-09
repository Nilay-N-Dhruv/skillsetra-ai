"use client";

import { useState } from "react";
import useApi from "@/hooks/useApi";
import { ErrorBox, Loading } from "@/components/Status";

function actionLabel(type) {
  if (type === "youtube") return "Watch";
  if (type === "pdf") return "View PDF";
  if (type === "ppt") return "View";
  return "Open";
}

export default function Resources() {
  const [skill, setSkill] = useState("");

  const {
    data,
    error,
    loading,
    reload,
  } = useApi(
    "/resources" +
      (skill ? `?skill=${encodeURIComponent(skill)}` : "")
  );

  if (error) {
    return <ErrorBox message={error} onRetry={reload} />;
  }

  return (
    <>
      <p className="eyebrow">Resource library</p>

      <h1>
        Learning materials for {data?.role || "your role"}
      </h1>

      <p className="muted">
        Browse the learning materials provided for SkillSetra. This library
        includes videos, PDFs, slides, documentation, repositories, notes,
        courses and other resources. External materials open at their
        original source.
      </p>

      <label htmlFor="sk">Skill / topic</label>

      <select
        id="sk"
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
        style={{ maxWidth: 360 }}
      >
        <option value="">All available materials</option>

        {(data?.skills || []).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {loading && !data ? (
        <Loading />
      ) : (
        <>
          <div
            className="row small muted"
            style={{ marginTop: 16 }}
          >
            <span>
              {data?.items?.length || 0} materials
            </span>

            {skill && (
              <span>
                · filtered to {skill}
              </span>
            )}
          </div>

          {data?.items?.length ? (
            <div
              className="grid g3"
              style={{ marginTop: 20 }}
            >
              {data.items.map((r) => (
                <div
                  className="card"
                  key={`${r.key}-${r.url}`}
                >
                  <div
                    className="row"
                    style={{
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span className="badge none">
                      {r.for}
                    </span>

                    <span className="small muted">
                      {r.type}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "12px 0 6px",
                      fontSize: "1.05rem",
                    }}
                  >
                    {r.title}
                  </h3>

                  <p className="small muted">
                    {r.level}
                  </p>

                  <div
                    className="row"
                    style={{
                      marginTop: 14,
                      gap: 8,
                    }}
                  >
                    <a
                      className="btn"
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {actionLabel(r.type)}
                    </a>

                    {r.type === "pdf" && (
                      <a
                        className="btn"
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="card"
              style={{ marginTop: 20 }}
            >
              <h3>No materials found</h3>

              <p className="muted">
                There are no provided materials for this
                selection yet.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}