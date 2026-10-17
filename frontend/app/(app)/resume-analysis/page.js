
"use client";

import { useRef, useState } from "react";
import { callAI } from "@/lib/ai";
import { getToken } from "@/lib/auth";
import AiTag from "@/components/AiTag";
import {
  FileUp,
  FileText,
  Download,
  X,
  ChartNoAxesCombined,
  CheckCircle2,
  AlertTriangle,
  BriefcaseBusiness,
  GraduationCap,
  Code2,
  Target,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_CHARS = 16000;

function getApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000"
  ).replace(/\/+$/, "");
}

function extractScore(report) {
  if (!report) return null;

  const patterns = [
    /(?:overall\s+)?(?:resume\s+)?(?:match\s+)?score\s*[:\-–]\s*(\d{1,3})\s*(?:%|\/\s*100)?/i,
    /(?:overall\s+)?(?:resume\s+)?(?:match\s+)?score[^\n]{0,45}?(\d{1,3})\s*(?:%|\/\s*100)/i,
    /(?:^|\n)\s*#{1,4}\s*.*?score[^\n]*\n\s*(\d{1,3})\s*(?:%|\/\s*100)?/i,
  ];

  for (const pattern of patterns) {
    const match = String(report).match(pattern);
    if (match) {
      const score = Number(match[1]);
      if (score >= 0 && score <= 100) return score;
    }
  }

  return null;
}

function countMatches(text, patterns) {
  return patterns.reduce(
    (total, pattern) => total + (pattern.test(text) ? 1 : 0),
    0
  );
}

function getAnalytics(resume, role, report) {
  const text = String(resume || "");
  const lower = text.toLowerCase();
  const words = text.match(/\b[\w+#.-]+\b/g) || [];
  const wordCount = words.length;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const sections = [
    {
      label: "Contact information",
      found: /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text) ||
        /linkedin\.com|github\.com/i.test(text),
    },
    {
      label: "Professional summary",
      found: /summary|objective|profile|about me/i.test(text),
    },
    {
      label: "Skills",
      found: /technical skills|core skills|skills|technologies/i.test(text),
    },
    {
      label: "Work experience",
      found: /experience|employment|professional history|internship/i.test(text),
    },
    {
      label: "Projects",
      found: /projects|personal projects|academic projects/i.test(text),
    },
    {
      label: "Education",
      found: /education|university|college|bachelor|master|degree|diploma/i.test(text),
    },
    {
      label: "Achievements",
      found: /achievements|awards|certifications|certificates|accomplishments/i.test(text),
    },
  ];

  const technicalTerms = [
    "python", "javascript", "typescript", "java", "c++", "c#",
    "react", "next.js", "node.js", "fastapi", "django", "flask",
    "sql", "postgresql", "mysql", "mongodb", "redis",
    "html", "css", "tailwind", "rest api", "graphql",
    "docker", "kubernetes", "aws", "azure", "gcp",
    "git", "github", "ci/cd", "linux",
    "machine learning", "deep learning", "pandas", "numpy",
    "tensorflow", "pytorch", "data analysis", "power bi",
    "tableau", "excel", "cybersecurity", "testing",
    "pytest", "jest", "agile", "scrum",
  ];

  const matchedSkills = technicalTerms.filter((term) =>
    new RegExp(
      `(^|[^a-z0-9+#])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9+#]|$)`,
      "i"
    ).test(text)
  );

  const actionVerbs = [
    "built", "developed", "designed", "implemented", "created",
    "improved", "optimized", "automated", "deployed", "managed",
    "led", "delivered", "reduced", "increased", "tested",
    "analyzed", "integrated", "maintained", "launched",
  ];

  const actionCount = actionVerbs.reduce((total, verb) => {
    const pattern = new RegExp(`\\b${verb}\\b`, "gi");
    return total + (text.match(pattern) || []).length;
  }, 0);

  const measurableResults =
    (text.match(/\b\d+(?:\.\d+)?\s*(?:%|percent|x|users|customers|projects|hours|days|weeks|months|years)\b/gi) || []).length;

  const bulletCount = lines.filter((line) => /^[-*•▪]\s+/.test(line)).length;
  const sectionCount = sections.filter((section) => section.found).length;
  const score = extractScore(report);

  const roleWords = String(role || "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length > 2);

  const roleMatches = roleWords.filter((word) => lower.includes(word));

  const indicators = [
    {
      label: "Resume length",
      value: `${wordCount} words`,
      detail: wordCount < 150
        ? "Very short; consider adding relevant details."
        : wordCount > 1000
          ? "Long resume; check for unnecessary content."
          : "Word count is within a broad review range.",
      status: wordCount >= 150 && wordCount <= 1000 ? "good" : "review",
    },
    {
      label: "Detected sections",
      value: `${sectionCount} / ${sections.length}`,
      detail: "Based on common section headings and keywords.",
      status: sectionCount >= 5 ? "good" : "review",
    },
    {
      label: "Technical keywords",
      value: `${matchedSkills.length}`,
      detail: "Unique terms found from a built-in technology vocabulary.",
      status: matchedSkills.length >= 5 ? "good" : "review",
    },
    {
      label: "Action verbs",
      value: `${actionCount}`,
      detail: "Occurrences of common project and achievement verbs.",
      status: actionCount >= 3 ? "good" : "review",
    },
    {
      label: "Measurable results",
      value: `${measurableResults}`,
      detail: "Potential numerical outcomes detected; these are not verified.",
      status: measurableResults > 0 ? "good" : "review",
    },
    {
      label: "Bullet points",
      value: `${bulletCount}`,
      detail: "Lines formatted with common bullet characters.",
      status: bulletCount >= 3 ? "good" : "review",
    },
  ];

  return {
    wordCount,
    sectionCount,
    sections,
    matchedSkills,
    actionCount,
    measurableResults,
    bulletCount,
    score,
    roleMatches,
    roleWords,
    indicators,
    linesCount: lines.length,
    contactFound: sections[0].found,
    roleProvided: Boolean(role.trim()),
    roleMatchCount: roleMatches.length,
    hasEmail: /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text),
    hasPhone: /(?:\+?\d[\d\s().-]{7,}\d)/.test(text),
    reportAvailable: Boolean(report),
    estimatedReadMinutes: Math.max(1, Math.ceil(wordCount / 200)),
    report,
  };
}

function FormattedReport({ text }) {
  const lines = String(text || "").split(/\r?\n/);

  return (
    <div
      className="resume-report"
      style={{ lineHeight: 1.7, overflowWrap: "anywhere" }}
    >
      {lines.map((raw, index) => {
        const line = raw.trim();

        if (!line) {
          return <div key={index} style={{ height: 7 }} />;
        }

        const heading = line.match(/^#{1,4}\s+(.+)$/);

        if (heading) {
          return (
            <h3 key={index} style={{ margin: "18px 0 7px" }}>
              {heading[1].replace(/\*\*/g, "")}
            </h3>
          );
        }

        if (/^[-*•▪]\s+/.test(line)) {
          return (
            <p key={index} style={{ margin: "5px 0", paddingLeft: 12 }}>
              • {line.replace(/^[-*•▪]\s+/, "").replace(/\*\*/g, "")}
            </p>
          );
        }

        return (
          <p key={index} style={{ margin: "5px 0" }}>
            {line.replace(/\*\*/g, "").replace(/`([^`]+)`/g, "$1")}
          </p>
        );
      })}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, status }) {
  return (
    <div className="item" style={{ minWidth: 0 }}>
      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <span className="small muted">{label}</span>
        <Icon size={18} aria-hidden="true" />
      </div>
      <h2 style={{ fontSize: 25, margin: "12px 0 5px" }}>{value}</h2>
      {detail && (
        <p className="small muted" style={{ margin: 0 }}>
          {detail}
        </p>
      )}
      {status && (
        <p
          className="small"
          style={{
            margin: "8px 0 0",
            color: status === "good" ? "var(--good, #14804a)" : "var(--muted, #6b7280)",
          }}
        >
          {status === "good" ? "✓ Indicator found" : "Review recommended"}
        </p>
      )}
    </div>
  );
}

function AnalyticsSection({ analytics }) {
  const [showAllSkills, setShowAllSkills] = useState(false);

  if (!analytics) return null;

  const score = analytics.score;
  const visibleSkills = showAllSkills
    ? analytics.matchedSkills
    : analytics.matchedSkills.slice(0, 12);

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <ChartNoAxesCombined size={23} />
        <div>
          <h2 style={{ margin: 0 }}>Resume Analytics</h2>
          <p className="small muted" style={{ margin: "4px 0 0" }}>
            A breakdown of resume content, structure, and role alignment.
          </p>
        </div>
      </div>

      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginTop: 18,
        }}
      >
        <MetricCard
          icon={Target}
          label="AI resume match"
          value={score === null ? "N/A" : `${score}%`}
          detail={
            score === null
              ? "The AI report did not contain a readable score."
              : "Score reported by the AI analysis."
          }
        />
        <MetricCard
          icon={FileText}
          label="Resume length"
          value={`${analytics.wordCount}`}
          detail={`Words · about ${analytics.estimatedReadMinutes} min read`}
        />
        <MetricCard
          icon={BriefcaseBusiness}
          label="Sections detected"
          value={`${analytics.sectionCount}/${analytics.sections.length}`}
          detail="Common resume sections"
        />
        <MetricCard
          icon={Code2}
          label="Technical terms"
          value={`${analytics.matchedSkills.length}`}
          detail="Unique known terms detected"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Action verbs"
          value={`${analytics.actionCount}`}
          detail="Occurrences of common action verbs"
        />
        <MetricCard
          icon={BarChart3}
          label="Measurable results"
          value={`${analytics.measurableResults}`}
          detail="Potential numeric outcomes found"
        />
      </div>

      {score !== null && (
        <div className="item" style={{ marginTop: 14 }}>
          <div
            className="row"
            style={{ justifyContent: "space-between", gap: 12 }}
          >
            <strong>AI-reported resume score</strong>
            <strong>{score}%</strong>
          </div>
          <div
            role="progressbar"
            aria-label="AI-reported resume score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            style={{
              height: 10,
              borderRadius: 10,
              overflow: "hidden",
              background: "var(--line, #dce7df)",
              marginTop: 10,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${score}%`,
                background: "#14964e",
                transition: "width 250ms ease",
              }}
            />
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            This is an AI estimate, not an ATS certification or hiring prediction.
          </p>
        </div>
      )}

      <h3 style={{ marginTop: 22 }}>Section checklist</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {analytics.sections.map((section) => (
          <div
            key={section.label}
            className="item row"
            style={{ justifyContent: "space-between", gap: 12 }}
          >
            <span>{section.label}</span>
            <span
              className="small"
              style={{
                color: section.found ? "#14804a" : "var(--muted, #6b7280)",
              }}
            >
              {section.found ? "Detected" : "Not detected"}
            </span>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 22 }}>Detected technical keywords</h3>
      {analytics.matchedSkills.length > 0 ? (
        <>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            {visibleSkills.map((skill) => (
              <span
                key={skill}
                className="tag"
                style={{ padding: "5px 10px" }}
              >
                {skill}
              </span>
            ))}
          </div>
          {analytics.matchedSkills.length > 12 && (
            <button
              type="button"
              className="btn"
              style={{ marginTop: 10 }}
              onClick={() => setShowAllSkills((value) => !value)}
            >
              {showAllSkills ? "Show fewer keywords" : "Show all keywords"}
            </button>
          )}
        </>
      ) : (
        <p className="muted">
          No terms from the built-in technology vocabulary were detected.
          This does not mean the resume lacks technical skills.
        </p>
      )}

      {analytics.roleProvided && (
        <>
          <h3 style={{ marginTop: 22 }}>Target-role keyword check</h3>
          <p className="muted">
            Target role: <strong>{analytics.role}</strong>
          </p>
          {analytics.roleWords.length > 0 ? (
            <>
              <p>
                {analytics.roleMatchCount} of {analytics.roleWords.length}{" "}
                role words were found in the resume text.
              </p>
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                {analytics.roleWords.map((word, index) => {
                  const found = analytics.roleMatches.includes(word);
                  return (
                    <span
                      key={`${word}-${index}`}
                      className="tag"
                      style={{
                        background: found ? "#e4f5eb" : "#f3f4f6",
                        color: found ? "#176b3a" : "#59636d",
                        padding: "5px 9px",
                      }}
                    >
                      {found ? "✓ " : "○ "}
                      {word}
                    </span>
                  );
                })}
              </div>
              <p className="small muted">
                This is a literal keyword check, not a semantic assessment of
                whether you are qualified for the role.
              </p>
            </>
          ) : (
            <p className="muted">
              Enter a target role containing descriptive words to enable this check.
            </p>
          )}
        </>
      )}

      <h3 style={{ marginTop: 22 }}>Review indicators</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {analytics.indicators.map((indicator) => (
          <div
            key={indicator.label}
            className="item row"
            style={{ alignItems: "flex-start", gap: 10 }}
          >
            {indicator.status === "good" ? (
              <CheckCircle2 size={19} color="#14804a" />
            ) : (
              <AlertTriangle size={19} />
            )}
            <div style={{ flex: 1 }}>
              <strong>{indicator.label}</strong>
              <p className="small muted" style={{ margin: "4px 0 0" }}>
                {indicator.detail}
              </p>
            </div>
            <strong>{indicator.value}</strong>
          </div>
        ))}
      </div>

      <p className="small muted" style={{ marginTop: 16 }}>
        Analytics are computed from the extracted resume text and common
        keyword patterns. They may miss unusual headings, synonyms, formatting,
        and context. They are not a real ATS scan.
      </p>
    </section>
  );
}

export default function ResumeAnalysis() {
  const [resume, setResume] = useState("");
  const [fileName, setFileName] = useState("");
  const [role, setRole] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const analytics = result
    ? {
        ...getAnalytics(resume, role, result.report),
        role,
      }
    : null;

  function clearResult() {
    setResult(null);
    setError("");
  }

  async function readResume(file) {
    if (!file) return;

    clearResult();

    if (file.size > MAX_BYTES) {
      setError("Please choose a file smaller than 8 MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const extension = file.name.toLowerCase().split(".").pop();

    if (!["txt", "pdf", "docx"].includes(extension)) {
      setError("Use a PDF, DOCX, or TXT resume.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      if (extension === "txt") {
        const text = await file.text();
        if (text.trim().length < 80) {
          throw new Error("The file contains fewer than 80 readable characters.");
        }

        setResume(text.slice(0, MAX_CHARS));
        setFileName(file.name);
        return;
      }

      const token = await getToken();

      if (!token) {
        throw new Error("Please sign in to upload a resume.");
      }

      const form = new FormData();
      form.append("file", file);

      const response = await fetch(
        `${getApiBase()}/api/resume/extract`,
        {
          method: "POST",
          body: form,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        let message = `Resume extraction failed (HTTP ${response.status}).`;

        try {
          const data = await response.json();
          if (data.detail) {
            message =
              typeof data.detail === "string"
                ? data.detail
                : JSON.stringify(data.detail);
          }
        } catch {
          // Keep the HTTP status message if the server did not return JSON.
        }

        if (response.status === 404) {
          throw new Error(
            "The backend returned 404 for /api/resume/extract. Verify that the resume extraction router exists and is registered in FastAPI, and check NEXT_PUBLIC_API_URL."
          );
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (!data.text || data.text.trim().length < 80) {
        throw new Error(
          "Not enough readable text was found. Try a text-based PDF or paste the resume text manually."
        );
      }

      setResume(data.text.slice(0, MAX_CHARS));
      setFileName(file.name);
    } catch (err) {
      setError(err.message || "Could not read the file.");
    } finally {
      setBusy(false);
    }
  }

  async function analyze(event) {
    event.preventDefault();

    if (resume.trim().length < 80) {
      setError("Please provide at least 80 characters of resume text.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const response = await callAI("/resume/analyze", {
        method: "POST",
        body: {
          resume_text: resume.trim(),
          target_role: role.trim(),
        },
      });

      if (!response || typeof response.report !== "string" || !response.report.trim()) {
        throw new Error(
          "The analysis endpoint returned no report. Check the backend response format."
        );
      }

      setResult(response);
    } catch (err) {
      setError(err.message || "Could not analyze the resume.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result || typeof window === "undefined") return;

    const escapeHtml = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]);

    const reportHtml = String(result.report || "")
      .split(/\r?\n/)
      .map((raw) => {
        const line = raw.trim();
        if (!line) return "";

        const heading = line.match(/^#{1,4}\s+(.+)$/);

        if (heading) {
          return `<h2>${escapeHtml(heading[1].replace(/\*\*/g, ""))}</h2>`;
        }

        if (/^[-*•▪]\s+/.test(line)) {
          return `<p class="bullet">${escapeHtml(
            line.replace(/^[-*•▪]\s+/, "").replace(/\*\*/g, "")
          )}</p>`;
        }

        return `<p>${escapeHtml(
          line.replace(/\*\*/g, "").replace(/`([^`]+)`/g, "$1")
        )}</p>`;
      })
      .join("");

    const score = extractScore(result.report);
    const metrics = getAnalytics(resume, role, result.report);

    const popup = window.open("", "_blank", "width=900,height=700");

    if (!popup) {
      setError("Allow pop-ups to export your PDF report.");
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>SkillSetra Resume Analysis</title>
          <style>
            body {
              font: 14px Arial, sans-serif;
              color: #17251d;
              max-width: 800px;
              margin: 36px auto;
              padding: 0 16px;
              line-height: 1.6;
            }
            header {
              background: #117543;
              color: white;
              padding: 22px 26px;
              border-radius: 12px;
            }
            h1 { font-size: 25px; margin: 0; }
            h2 {
              font-size: 17px;
              margin: 22px 0 8px;
              border-bottom: 1px solid #dce7df;
              padding-bottom: 5px;
            }
            .score {
              font-size: 30px;
              color: #117543;
              font-weight: 700;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }
            .metric {
              border: 1px solid #dce7df;
              border-radius: 8px;
              padding: 12px;
            }
            .metric strong {
              display: block;
              font-size: 19px;
              margin-top: 6px;
            }
            .bullet { padding-left: 14px; }
            .bullet:before { content: "• "; margin-left: -14px; }
            .note {
              font-size: 11px;
              color: #627168;
              margin-top: 30px;
            }
            @media print {
              body { margin: 14mm auto; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <header>
            <h1>SkillSetra | Resume Analysis</h1>
            <p>
              Target role: ${escapeHtml(role || "Not specified")} ·
              ${escapeHtml(fileName || "Pasted resume text")} ·
              ${escapeHtml(new Date().toLocaleDateString())}
            </p>
          </header>

          <h2>Analytics summary</h2>
          <div class="grid">
            <div class="metric">Resume length<strong>${metrics.wordCount} words</strong></div>
            <div class="metric">Sections detected<strong>${metrics.sectionCount}/${metrics.sections.length}</strong></div>
            <div class="metric">Technical terms<strong>${metrics.matchedSkills.length}</strong></div>
            <div class="metric">Action verbs<strong>${metrics.actionCount}</strong></div>
            <div class="metric">Measurable results<strong>${metrics.measurableResults}</strong></div>
            <div class="metric">Bullet points<strong>${metrics.bulletCount}</strong></div>
          </div>

          ${
            score === null
              ? ""
              : `<h2>AI-reported resume match score</h2><div class="score">${score}%</div>`
          }

          <h2>AI feedback and recommendations</h2>
          ${reportHtml}

          <p class="note">
            AI-generated guidance and text-based indicators are not a hiring
            prediction, ATS certification, or security guarantee. Verify all
            suggestions and never claim skills or achievements you do not have.
          </p>
          <button onclick="window.print()">Print / Save as PDF</button>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);

    popup.document.close();
  }

  function resetForm() {
    setResume("");
    setFileName("");
    setRole("");
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <Link href="/dashboard" className="small">← Back to dashboard</Link>
      <p> </p>
      <p className="eyebrow">Career toolkit</p>
      <h1>Resume Analysis</h1>
      <p className="muted">
        Analyze your resume, explore its content and structure, and get
        role-focused feedback with actionable next steps.
      </p>

      <form className="card" onSubmit={analyze}>
        <label htmlFor="resume-file">
          Upload resume (PDF, DOCX, or TXT)
        </label>

        <input
          ref={fileRef}
          id="resume-file"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(event) => readResume(event.target.files?.[0])}
          disabled={busy}
        />

        <p className="small muted">
          Maximum 8 MB. Scanned PDFs may require OCR. PDF and DOCX uploads
          require a working backend extraction route.
        </p>

        {fileName && (
          <div
            className="item row"
            style={{ justifyContent: "space-between", gap: 10 }}
          >
            <span style={{ overflowWrap: "anywhere" }}>
              <FileText
                size={16}
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              {fileName}
            </span>

            <button
              type="button"
              className="btn"
              onClick={() => {
                setResume("");
                setFileName("");
                setResult(null);
                setError("");
                if (fileRef.current) fileRef.current.value = "";
              }}
              disabled={busy}
            >
              <X size={14} /> Remove
            </button>
          </div>
        )}

        <label htmlFor="target-role">Target role (optional)</label>
        <input
          id="target-role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setResult(null);
          }}
          maxLength={120}
          placeholder="e.g. Junior Python Developer"
          disabled={busy}
        />

        <label htmlFor="resume-text">
          Resume text (review or paste here)
        </label>
        <textarea
          id="resume-text"
          rows={12}
          value={resume}
          onChange={(event) => {
            setResume(event.target.value.slice(0, MAX_CHARS));
            setResult(null);
          }}
          maxLength={MAX_CHARS}
          minLength={80}
          required
          placeholder="Upload a file above, or paste your resume text here…"
          disabled={busy}
        />

        <p className="small muted">
          {resume.length}/{MAX_CHARS} characters · At least 80 characters required.
        </p>

        {error && (
          <div
            role="alert"
            className="item"
            style={{ color: "var(--bad-t, #b42318)", marginBottom: 12 }}
          >
            <strong>Resume Analysis error</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        )}

        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <button
            type="submit"
            className="btn primary"
            disabled={busy || resume.trim().length < 80}
          >
            {busy ? (
              "Analyzing…"
            ) : (
              <>
                <ChartNoAxesCombined size={16} /> Analyze resume
              </>
            )}
          </button>

          <button
            type="button"
            className="btn"
            onClick={resetForm}
            disabled={busy}
          >
            <RefreshCw size={16} /> Reset
          </button>
        </div>
      </form>

      {result && (
        <>
          <AnalyticsSection analytics={analytics} />

          <section className="card" style={{ marginTop: 16 }}>
            <div
              className="row"
              style={{ justifyContent: "space-between", gap: 10 }}
            >
              <h2 style={{ margin: 0 }}>
                <ChartNoAxesCombined
                  size={21}
                  style={{ verticalAlign: "middle", marginRight: 8 }}
                />
                AI Resume Feedback
              </h2>
              <AiTag source={result.source} />
            </div>

            <p className="muted">
              Detailed feedback, recommendations, and next steps from the AI
              analysis.
            </p>

            <FormattedReport text={result.report} />

            <div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="btn primary"
                onClick={download}
              >
                <Download size={16} /> Export professional report
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  setResult(null);
                  setError("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Edit resume
              </button>
            </div>

            <p className="small muted">
              AI feedback can miss context. Verify recommendations and never
              add skills or achievements you do not have.
            </p>
          </section>
        </>
      )}
    </>
  );
}
