// frontend/app/(app)/assessment/page.js

"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { ErrorBox, Loading } from "@/components/Status";

const LETTERS = ["A", "B", "C", "D"];

function Exam() {
  const router = useRouter();
  const params = useSearchParams();

  const [exam, setExam] = useState(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setErr(null);
    setExam(null);
    setResult(null);
    setAnswers({});
    setI(0);

    try {
      let role = params.get("role");

      if (!role) {
        role = (await api("/profile")).target_role;
      }

      if (!role) {
        router.replace("/onboarding");
        return;
      }

      const skill = params.get("skill");

      setExam(
        await api("/exam/start", {
          method: "POST",
          body: {
            role,
            ...(skill ? { skill } : {}),
          },
        })
      );
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    setBusy(true);
    setErr(null);

    try {
      setResult(
        await api("/exam/submit", {
          method: "POST",
          body: {
            session_id: exam.session_id,
            answers,
          },
        })
      );
    } catch (e) {
      setErr(e.message);
    }

    setBusy(false);
  }

  if (err && !exam) {
    return (
      <ErrorBox
        message={err}
        onRetry={start}
      />
    );
  }

  if (!exam) {
    return (
      <Loading
        label={
          params.get("skill")
            ? `Preparing your ${params.get("skill")} assessment`
            : "Preparing your assessment"
        }
      />
    );
  }

  if (result) {
    return (
      <>
        <p className="eyebrow">Assessment complete</p>

        <h1>
          {result.correct} of {result.total} answered correctly
        </h1>

        <p className="muted">
          This measures these applied questions only, not your overall
          ability. Review each answer, then see your dashboard.
        </p>

        <div
          className="grid"
          style={{ margin: "20px 0" }}
        >
          {result.review.map((r, n) => (
            <div className="card" key={r.id}>
              <p className="eyebrow">
                {n + 1} · {r.dimension} · {r.skill}
              </p>

              <h3>{r.prompt}</h3>

              {r.options.map((o, k) => (
                <div
                  key={k}
                  className={`option ${
                    k === r.correct_index
                      ? "right"
                      : k === r.chosen
                        ? "wrong"
                        : ""
                  }`}
                  style={{ cursor: "default" }}
                >
                  {LETTERS[k]}. {o}
                </div>
              ))}

              <p
                className="muted"
                style={{ margin: 0 }}
              >
                <strong>
                  {r.correct ? "Correct." : "Not quite."}
                </strong>{" "}
                {r.why}
              </p>
            </div>
          ))}
        </div>

        <div className="row">
          <Link
            className="btn primary"
            href="/dashboard"
          >
            Go to my dashboard
          </Link>

          <button
            className="btn"
            onClick={start}
          >
            Take another assessment
          </button>
        </div>
      </>
    );
  }

  const q = exam.questions[i];
  const last = i === exam.total - 1;

  return (
    <>
      <p className="eyebrow">
        {params.get("skill")
          ? `${params.get("skill")} re-test`
          : "Adaptive assessment"}{" "}
        · {i + 1}/{exam.total}
      </p>

      <h1>{exam.role} competency assessment</h1>

      <p className="muted">
        Questions come from a role-aligned bank on the server. Your
        answers are graded and saved when you submit.
      </p>

      <div
        className="bar"
        aria-hidden
        style={{ margin: "14px 0 20px" }}
      >
        <i
          style={{
            width: `${(i / exam.total) * 100}%`,
          }}
        />
      </div>

      <div className="card">
        <p className="eyebrow">
          {q.dimension} · {q.level}
        </p>

        <h2 style={{ fontSize: "1.7rem" }}>
          {q.prompt}
        </h2>

        <div
          role="radiogroup"
          aria-label="Answer choices"
          style={{ marginTop: 18 }}
        >
          {q.options.map((o, k) => (
            <button
              key={k}
              role="radio"
              aria-checked={answers[q.id] === k}
              className={`option ${
                answers[q.id] === k ? "on" : ""
              }`}
              onClick={() =>
                setAnswers({
                  ...answers,
                  [q.id]: k,
                })
              }
            >
              {LETTERS[k]}. {o}
            </button>
          ))}
        </div>

        {err && (
          <p
            role="alert"
            style={{ color: "var(--bad-t)" }}
          >
            {err}
          </p>
        )}

        <div className="row">
          {i > 0 && (
            <button
              className="btn"
              onClick={() => setI(i - 1)}
            >
              Previous
            </button>
          )}

          {last ? (
            <button
              className="btn primary"
              disabled={
                busy ||
                answers[q.id] === undefined
              }
              onClick={submit}
            >
              {busy
                ? "Grading…"
                : "Submit assessment"}
            </button>
          ) : (
            <button
              className="btn primary"
              disabled={
                answers[q.id] === undefined
              }
              onClick={() => setI(i + 1)}
            >
              Next question
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function Assessment() {
  return (
    <Suspense fallback={<Loading />}>
      <Exam />
    </Suspense>
  );
}