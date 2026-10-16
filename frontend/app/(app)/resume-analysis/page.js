"use client";

import { useRef, useState } from "react";
import { callAI } from "@/lib/ai";
import { getToken } from "@/lib/auth";
import AiTag from "@/components/AiTag";
import { FileUp, FileText, Download, X, ChartNoAxesCombined } from "lucide-react";

const MAX_BYTES = 8 * 1024 * 1024;

function extractScore(markdown) {
  if (!markdown) return null;
  const section = markdown.match(/(?:#{1,4}\s*)?(?:overall\s+)?score\s*\(?(?:0\s*[-–]\s*100)?\)?[^\n]*\n\s*(?:\*\*)?\s*(100|[1-9]?\d)\s*(?:%|\/100)?/i);
  const general = markdown.match(/(?:overall\s+)?score[^\n]{0,45}?(100|[1-9]?\d)\s*(?:%|\/100)/i);
  const match = section || general;
  return match ? Math.max(0, Math.min(100, Number(match[1]))) : null;
}

function FormattedReport({ text }) {
  const lines = String(text || "").split(/\r?\n/);
  return <div className="resume-report" style={{ lineHeight: 1.65, overflowWrap: "anywhere" }}>
    {lines.map((raw, index) => {
      const line = raw.trim();
      if (!line) return <div key={index} style={{ height: 8 }} />;
      const heading = line.match(/^#{1,4}\s+(.+)$/);
      if (heading) return <h3 key={index} style={{ margin: "16px 0 6px" }}>{heading[1].replace(/\*\*/g, "")}</h3>;
      if (/^[-*•]\s+/.test(line)) return <p key={index} style={{ margin: "4px 0", paddingLeft: 12 }}>• {line.replace(/^[-*•]\s+/, "").replace(/\*\*/g, "")}</p>;
      return <p key={index} style={{ margin: "5px 0" }}>{line.replace(/\*\*/g, "").replace(/`([^`]+)`/g, "$1")}</p>;
    })}
  </div>;
}

export default function ResumeAnalysis() {
  const [resume, setResume] = useState("");
  const [fileName, setFileName] = useState("");
  const [role, setRole] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  async function readResume(file) {
    if (!file) return;
    setError(""); setResult(null);
    if (file.size > MAX_BYTES) { setError("Please choose a file smaller than 8 MB."); return; }
    const ext = file.name.toLowerCase().split(".").pop();
    if (!["txt", "pdf", "docx"].includes(ext)) {
      setError("Use a PDF, DOCX, or TXT resume."); return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = await getToken();
      if (!token) throw new Error("Please sign in to upload a resume.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/resume/extract`, {
        method: "POST", body: form, headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        let message = "Could not read this file.";
        try { const data = await response.json(); message = data.detail || message; } catch {}
        throw new Error(message);
      }
      const data = await response.json();
      if (!data.text || data.text.trim().length < 80) throw new Error("Not enough readable text was found. Try a text-based PDF or paste the resume text manually.");
      setResume(data.text.slice(0, 16000)); setFileName(file.name);
    } catch (e) {
      // If TXT, browser fallback still works when the API is unavailable.
      if (ext === "txt") {
        try { const text = await file.text(); setResume(text.slice(0, 16000)); setFileName(file.name); setError("The file was read in your browser. Check the API connection before analyzing."); }
        catch { setError(e.message || "Could not read the file."); }
      } else setError(e.message || "Could not read the file. Ensure the backend is running.");
    } finally { setBusy(false); }
  }

  async function analyze(e) {
    e.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      setResult(await callAI("/resume/analyze", {
        method: "POST", body: { resume_text: resume.trim(), target_role: role.trim() },
      }));
    } catch (e) { setError(e.message || "Could not analyze the resume."); }
    finally { setBusy(false); }
  }

  function download() {
    if (!result || typeof window === "undefined") return;
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    const score = extractScore(result.report);
    const body = String(result.report || "").split(/\r?\n/).map((raw) => {
      const line = raw.trim(); if (!line) return "";
      const heading = line.match(/^#{1,4}\s+(.+)$/);
      if (heading) return `<h2>${escapeHtml(heading[1].replace(/\*\*/g, ""))}</h2>`;
      if (/^[-*•]\s+/.test(line)) return `<p class="bullet">${escapeHtml(line.replace(/^[-*•]\s+/, "").replace(/\*\*/g, ""))}</p>`;
      return `<p>${escapeHtml(line.replace(/\*\*/g, "").replace(/`([^`]+)`/g, "$1"))}</p>`;
    }).join("");
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) { setError("Allow pop-ups to export your PDF report."); return; }
    popup.document.write(`<!doctype html><html><head><title>SkillSetra Resume Analysis</title><style>body{font:14px Arial,sans-serif;color:#17251d;max-width:800px;margin:36px auto;line-height:1.6}header{background:#117543;color:#fff;padding:22px 26px;border-radius:12px}h1{font-size:25px;margin:0}header p{margin:6px 0 0}h2{font-size:16px;margin:22px 0 8px;border-bottom:1px solid #dce7df;padding-bottom:5px}.score{font-size:30px;color:#117543;font-weight:700}.track{height:8px;background:#dce7df;border-radius:8px;overflow:hidden}.track i{display:block;background:#14964e;height:100%}.bullet{padding-left:14px}.bullet:before{content:"• ";margin-left:-14px}.note{font-size:11px;color:#627168;margin-top:30px}@media print{body{margin:14mm}button{display:none}h2{break-after:avoid}}</style></head><body><header><h1>SkillSetra | Resume Analysis</h1><p>Target role: ${escapeHtml(role || "Not specified")} · ${escapeHtml(fileName || "Pasted resume text")} · ${escapeHtml(new Date().toLocaleDateString())}</p></header>${score === null ? "" : `<section><h2>Resume match score</h2><div class="score">${score}%</div><div class="track"><i style="width:${score}%"></i></div></section>`}${body}<p class="note">AI-generated guidance, not a hiring prediction. Verify all suggestions and never claim skills or achievements you do not have.</p><button onclick="window.print()">Print / Save as PDF</button><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  }

  return <>
    <p className="eyebrow">Career toolkit</p><h1>Resume analysis</h1>
    <p className="muted">Upload your resume and get short, simple, role-focused feedback with an overall score and clear next steps.</p>
    <form className="card" onSubmit={analyze}>
      <label htmlFor="resume-file">Upload resume (PDF, DOCX, or TXT)</label>
      <input ref={fileRef} id="resume-file" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(e) => readResume(e.target.files?.[0])} />
      <p className="small muted">Maximum 8 MB. Scanned PDFs may need OCR and may not extract text. Your resume is sent to your SkillSetra backend for text extraction.</p>
      {fileName && <div className="item row" style={{justifyContent:"space-between"}}><span><FileText size={16} style={{verticalAlign:"middle",marginRight:6}}/>{fileName}</span><button type="button" className="btn" onClick={() => {setResume("");setFileName("");if(fileRef.current)fileRef.current.value="";}}><X size={14}/> Remove</button></div>}
      <label htmlFor="target-role">Target role (optional)</label><input id="target-role" value={role} onChange={(e)=>setRole(e.target.value)} maxLength={120} placeholder="e.g. Junior Python Developer" />
      <label htmlFor="resume-text">Resume text (review or paste here)</label><textarea id="resume-text" rows={12} value={resume} onChange={(e)=>setResume(e.target.value)} maxLength={16000} minLength={80} required placeholder="Upload a file above, or paste your resume text here…" />
      <p className="small muted">{resume.length}/16000 characters · At least 80 characters required.</p>
      {error && <p role="alert" style={{color:"var(--bad-t)"}}>{error}</p>}
      <button className="btn primary" disabled={busy || resume.trim().length < 80}>{busy ? "Reading / analyzing…" : <><FileUp size={16}/> Analyze resume</>}</button>
    </form>
    {result && <section className="card" style={{marginTop:16}}>
      <div className="row" style={{justifyContent:"space-between"}}><h2><ChartNoAxesCombined size={21} style={{verticalAlign:"middle",marginRight:8}}/>Resume feedback</h2><AiTag source={result.source}/></div>
      {(() => { const score = extractScore(result.report); return score === null ? <p className="small muted">No reliable numeric score was found in the AI report. Review the written feedback below.</p> : <div className="item" style={{marginBottom:12}}><div className="row" style={{justifyContent:"space-between"}}><strong>Resume match score</strong><strong>{score}%</strong></div><div className="bar" style={{height:12}}><i style={{width:`${score}%`}} /></div><p className="small muted">AI estimate based on the target role, not a hiring prediction.</p></div>; })()}
      <FormattedReport text={result.report} />
      <button className="btn primary" style={{marginTop:12}} onClick={download}><Download size={16}/> Download professional PDF</button>
      <p className="small muted">AI feedback can miss context. Verify recommendations and never add skills or achievements you do not have.</p>
    </section>}
  </>;
}
