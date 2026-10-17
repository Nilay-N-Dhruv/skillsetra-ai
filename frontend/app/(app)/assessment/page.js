
// "use client";

// import Link from "next/link";
// import { Suspense, useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { api } from "@/lib/api";
// import { ErrorBox, Loading } from "@/components/Status";

// const LETTERS = ["A", "B", "C", "D"];
// const LEVELS = ["Beginner", "Intermediate", "Advanced"];

// function Exam() {
//   const router = useRouter();
//   const params = useSearchParams();

//   const [exam, setExam] = useState(null);
//   const [index, setIndex] = useState(0);
//   const [answers, setAnswers] = useState({});
//   const [result, setResult] = useState(null);
//   const [err, setErr] = useState(null);
//   const [busy, setBusy] = useState(false);
//   const [selectedLevel, setSelectedLevel] = useState(
//     params.get("level") || "Beginner"
//   );

//   async function start(levelOverride = selectedLevel) {
//     setErr(null);
//     setExam(null);
//     setResult(null);
//     setAnswers({});
//     setIndex(0);
//     setBusy(false);

//     try {
//       let role = params.get("role");

//       if (!role) {
//         const profile = await api("/profile");
//         role = profile.target_role;
//       }

//       if (!role) {
//         router.replace("/onboarding");
//         return;
//       }

//       const skill = params.get("skill");

//       const nextExam = await api("/exam/start", {
//         method: "POST",
//         body: {
//           role,
//           level: levelOverride,
//           ...(skill ? { skill } : {}),
//         },
//       });

//       if (!Array.isArray(nextExam.questions) ||
//           nextExam.questions.length === 0) {
//         setExam(nextExam);
//         setErr(
//           "No questions are available for this role and level. " +
//           "Choose another difficulty or try again later."
//         );
//         return;
//       }

//       setExam(nextExam);
//       setSelectedLevel(nextExam.level || levelOverride);
//     } catch (error) {
//       setErr(error.message || "Unable to start the assessment.");
//     }
//   }

//   useEffect(() => {
//     const initialLevel = LEVELS.includes(params.get("level"))
//       ? params.get("level")
//       : "Beginner";

//     setSelectedLevel(initialLevel);
//     start(initialLevel);

//     // Start once when the page mounts.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   async function submit() {
//     if (!exam || busy) return;

//     setBusy(true);
//     setErr(null);

//     try {
//       const data = await api("/exam/submit", {
//         method: "POST",
//         body: {
//           session_id: exam.session_id,
//           answers,
//         },
//       });

//       setResult(data);
//     } catch (error) {
//       setErr(error.message || "Unable to submit the assessment.");
//     } finally {
//       setBusy(false);
//     }
//   }

//   if (!exam && !err) {
//     return <Loading label="Preparing your assessment..." />;
//   }

//   if (err && !exam) {
//     return <ErrorBox message={err} onRetry={() => start()} />;
//   }

//   const questions = Array.isArray(exam?.questions)
//     ? exam.questions
//     : [];

//   if (exam && questions.length === 0 && !result) {
//     return (
//       <div className="card">
//         <h2>No questions available</h2>
//         <p className="muted">{err || "Please select another level."}</p>

//         <label htmlFor="retry-level">Difficulty level</label>
//         <select
//           id="retry-level"
//           value={selectedLevel}
//           onChange={(event) => setSelectedLevel(event.target.value)}
//         >
//           {LEVELS.map((level) => (
//             <option key={level} value={level}>
//               {level}
//             </option>
//           ))}
//         </select>

//         <button
//           className="btn primary"
//           style={{ marginTop: 12 }}
//           onClick={() => start(selectedLevel)}
//         >
//           Try again
//         </button>
//       </div>
//     );
//   }

//   if (result) {
//     const total = Number(result.total) || questions.length;
//     const correct = Number(result.correct) || 0;
//     const percentage = total > 0
//       ? Math.round((correct / total) * 100)
//       : 0;

//     return (
//       <>
//         <p className="eyebrow">Assessment complete</p>
//         <h1>Your results</h1>

//         <div className="card" style={{ marginBottom: 20 }}>
//           <h2>{percentage}%</h2>
//           <p>
//             You answered {correct} out of {total} questions correctly.
//           </p>

//           <div
//             className="bar"
//             role="progressbar"
//             aria-label="Assessment score"
//             aria-valuemin={0}
//             aria-valuemax={100}
//             aria-valuenow={percentage}
//           >
//             <i style={{ width: `${percentage}%` }} />
//           </div>

//           <p className="small muted">
//             This score reflects this assessment only, not your overall ability.
//           </p>
//         </div>

//         <h2>Answer review</h2>

//         {(result.review || []).map((item, number) => (
//           <div className="card" key={item.id || number}>
//             <p className="eyebrow">
//               Question {number + 1}
//               {item.dimension ? ` · ${item.dimension}` : ""}
//             </p>

//             <h3>{item.prompt}</h3>

//             {(item.options || []).map((option, optionIndex) => (
//               <div
//                 key={optionIndex}
//                 className={`option ${
//                   optionIndex === item.correct_index
//                     ? "right"
//                     : optionIndex === item.chosen
//                       ? "wrong"
//                       : ""
//                 }`}
//                 style={{ cursor: "default" }}
//               >
//                 {LETTERS[optionIndex]}. {option}
//               </div>
//             ))}

//             <p>
//               <strong>{item.correct ? "Correct" : "Incorrect"}</strong>
//               {item.why ? ` — ${item.why}` : ""}
//             </p>
//           </div>
//         ))}

//         <div className="row" style={{ marginTop: 20 }}>
//           <Link className="btn primary" href="/dashboard">
//             Go to dashboard
//           </Link>

//           <button
//             className="btn"
//             onClick={() => start(selectedLevel)}
//           >
//             Try again
//           </button>
//         </div>
//       </>
//     );
//   }

//   const questionCount = questions.length;
//   const question = questions[index];
//   const isLast = index === questionCount - 1;
//   const answeredCount = Object.keys(answers).length;
//   const progress = Math.round(
//     (answeredCount / questionCount) * 100
//   );

//   function changeLevel(level) {
//     setSelectedLevel(level);
//     start(level);
//   }

//   return (
//     <>
//       <p className="eyebrow">SkillSetra · Assessment</p>
//       <h1>{exam.role} assessment</h1>

//       <p className="muted">
//         Answer one question at a time. Your results appear after the final
//         question.
//       </p>

//       <div className="card" style={{ marginBottom: 18 }}>
//         <label htmlFor="assessment-level">Difficulty level</label>

//         <select
//           id="assessment-level"
//           value={selectedLevel}
//           disabled={busy}
//           onChange={(event) => changeLevel(event.target.value)}
//         >
//           {LEVELS.map((level) => (
//             <option key={level} value={level}>
//               {level}
//             </option>
//           ))}
//         </select>

//         <p className="small muted">
//           Changing the level starts a new assessment.
//         </p>
//       </div>

//       <div className="row" style={{ justifyContent: "space-between" }}>
//         <p className="eyebrow">
//           Question {index + 1} of {questionCount}
//         </p>
//         <strong>{progress}% answered</strong>
//       </div>

//       <div
//         className="bar"
//         role="progressbar"
//         aria-label="Assessment completion"
//         aria-valuemin={0}
//         aria-valuemax={100}
//         aria-valuenow={progress}
//         style={{ marginBottom: 20 }}
//       >
//         <i style={{ width: `${progress}%` }} />
//       </div>

//       <div className="card">
//         <p className="eyebrow">
//           {question.dimension || question.skill || "General"}
//           {" · "}
//           {question.level || selectedLevel}
//         </p>

//         <h2 style={{ fontSize: "1.6rem", lineHeight: 1.35 }}>
//           {question.prompt}
//         </h2>

//         <div
//           role="radiogroup"
//           aria-label="Answer choices"
//           style={{ marginTop: 18 }}
//         >
//           {(question.options || []).map((option, optionIndex) => {
//             const selected = answers[question.id] === optionIndex;

//             return (
//               <button
//                 type="button"
//                 key={optionIndex}
//                 role="radio"
//                 aria-checked={selected}
//                 className={`option ${selected ? "on" : ""}`}
//                 onClick={() =>
//                   setAnswers((previous) => ({
//                     ...previous,
//                     [question.id]: optionIndex,
//                   }))
//                 }
//                 style={{
//                   width: "100%",
//                   textAlign: "left",
//                   marginBottom: 10,
//                 }}
//               >
//                 <strong>{LETTERS[optionIndex]}.</strong> {option}
//               </button>
//             );
//           })}
//         </div>

//         {err && (
//           <p role="alert" style={{ color: "var(--bad-t)" }}>
//             {err}
//           </p>
//         )}

//         <div className="row" style={{ marginTop: 18 }}>
//           {index > 0 && (
//             <button
//               type="button"
//               className="btn"
//               disabled={busy}
//               onClick={() => setIndex((previous) => previous - 1)}
//             >
//               Previous
//             </button>
//           )}

//           {!isLast ? (
//             <button
//               type="button"
//               className="btn primary"
//               disabled={answers[question.id] === undefined || busy}
//               onClick={() => setIndex((previous) => previous + 1)}
//             >
//               Next question
//             </button>
//           ) : (
//             <button
//               type="button"
//               className="btn primary"
//               disabled={answers[question.id] === undefined || busy}
//               onClick={submit}
//             >
//               {busy ? "Grading..." : "Submit assessment"}
//             </button>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default function Assessment() {
//   return (
//     <Suspense fallback={<Loading />}>
//       <Exam />
//     </Suspense>
//   );
// }


"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { ErrorBox, Loading } from "@/components/Status";

const LETTERS = ["A", "B", "C", "D"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Senior"];

function Exam() {
  const router = useRouter();
  const params = useSearchParams();

  const [exam, setExam] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(
    LEVELS.includes(params.get("level"))
      ? params.get("level")
      : "Beginner"
  );

  async function start(level = selectedLevel) {
    setBusy(true);
    setErr(null);
    setExam(null);
    setResult(null);
    setAnswers({});
    setIndex(0);

    try {
      let role = params.get("role");

      if (!role) {
        const profile = await api("/profile");
        role = profile.target_role;
      }

      if (!role) {
        router.replace("/onboarding");
        return;
      }

      const skill = params.get("skill");

      const data = await api("/exam/start", {
        method: "POST",
        body: {
          role,
          level,
          ...(skill ? { skill } : {}),
        },
      });

      setExam(data);
      setSelectedLevel(data.level || level);

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        setErr(
          data.notice ||
            "No questions are available for this level. Choose another difficulty."
        );
      }
    } catch (error) {
      setErr(error.message || "Unable to start the assessment.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const level = LEVELS.includes(params.get("level"))
      ? params.get("level")
      : "Beginner";

    setSelectedLevel(level);
    start(level);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    if (!exam || busy) return;

    const questions = Array.isArray(exam.questions)
      ? exam.questions
      : [];

    if (!questions.every((q) => Number.isInteger(answers[q.id]))) {
      setErr("Please answer every question before submitting.");
      return;
    }

    setBusy(true);
    setErr(null);

    try {
      const data = await api("/exam/submit", {
        method: "POST",
        body: {
          session_id: exam.session_id,
          answers,
        },
      });

      setResult(data);
    } catch (error) {
      setErr(error.message || "Unable to submit the assessment.");
    } finally {
      setBusy(false);
    }
  }

  if (!exam && busy) {
    return <Loading label="Preparing your assessment..." />;
  }

  if (!exam && err) {
    return <ErrorBox message={err} onRetry={() => start()} />;
  }

  if (!exam) {
    return <Loading label="Preparing your assessment..." />;
  }

  const questions = Array.isArray(exam.questions)
    ? exam.questions
    : [];

  /* ===================== RESULTS ===================== */

  if (result) {
    const total = Number(result.total ?? questions.length);
    const correct = Number(result.correct ?? 0);

    const pct =
      result.pct !== undefined && result.pct !== null
        ? Number(result.pct)
        : total > 0
          ? Math.round((correct / total) * 100)
          : 0;

    const role = result.role || exam.role || "Assessment";
    const skill = params.get("skill");

    const nextUrl =
      `/assessment?role=${encodeURIComponent(role)}` +
      `&level=${encodeURIComponent(selectedLevel)}` +
      (skill ? `&skill=${encodeURIComponent(skill)}` : "");

    return (
      <>
        <p className="eyebrow">Assessment complete</p>
        <h1>{role} results</h1>

        <div className="card" style={{ marginBottom: 20 }}>
          <p className="eyebrow">Your assessment score</p>

          <h2 style={{ fontSize: "2.5rem", margin: "8px 0" }}>
            {pct}%
          </h2>

          <p>
            You answered {correct} out of {total} questions correctly.
          </p>

          <div
            className="bar"
            role="progressbar"
            aria-label="Assessment score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <i style={{ width: `${pct}%` }} />
          </div>

          <p className="small muted">
            Your result is saved by the server. This score reflects this
            assessment only, not your overall ability.
          </p>
        </div>

        <h2>Answer review</h2>

        {(result.review || []).map((item, number) => (
          <div className="card" key={item.id || number}>
            <p className="eyebrow">
              Question {number + 1}
              {item.dimension ? ` · ${item.dimension}` : ""}
            </p>

            <h3>{item.prompt}</h3>

            {(item.options || []).map((option, optionIndex) => (
              <div
                key={optionIndex}
                className={`option ${
                  optionIndex === item.correct_index
                    ? "right"
                    : optionIndex === item.chosen
                      ? "wrong"
                      : ""
                }`}
                style={{ cursor: "default" }}
              >
                {LETTERS[optionIndex]}. {option}
              </div>
            ))}

            <p>
              <strong>{item.correct ? "Correct" : "Incorrect"}</strong>
              {item.why ? ` — ${item.why}` : ""}
            </p>
          </div>
        ))}

        <div
          className="row"
          style={{ marginTop: 20, flexWrap: "wrap", gap: 12 }}
        >
          <Link className="btn primary" href="/dashboard">
            Go to dashboard
          </Link>

          <Link className="btn" href="/challenges">
            Next assessment
          </Link>

          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => start(selectedLevel)}
          >
            Try again
          </button>
        </div>
      </>
    );
  }

  /* ===================== NO QUESTIONS ===================== */

  if (!questions.length) {
    return (
      <div className="card">
        <h2>No questions available</h2>

        <p className="muted">
          {err || exam.notice || "Choose another difficulty level."}
        </p>

        <label htmlFor="retry-level">Difficulty level</label>

        <select
          id="retry-level"
          value={selectedLevel}
          disabled={busy}
          onChange={(event) => setSelectedLevel(event.target.value)}
        >
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn primary"
          style={{ marginTop: 12 }}
          disabled={busy}
          onClick={() => start(selectedLevel)}
        >
          {busy ? "Preparing..." : "Try again"}
        </button>

        {err && (
          <p role="alert" style={{ color: "var(--bad-t)" }}>
            {err}
          </p>
        )}
      </div>
    );
  }

  /* ===================== ACTIVE ASSESSMENT ===================== */

  const question = questions[index];
  const last = index === questions.length - 1;

  const answered = questions.filter((item) =>
    Number.isInteger(answers[item.id])
  ).length;

  const progress = Math.round((answered / questions.length) * 100);

  return (
    <>
      <p className="eyebrow">SkillSetra · Assessment</p>
      <h1>{exam.role} assessment</h1>

      <p className="muted">
        Answer one question at a time. Your results appear after the final
        question.
      </p>

      {exam.notice && (
        <p className="small muted">{exam.notice}</p>
      )}

      <div className="card" style={{ marginBottom: 18 }}>
        <label htmlFor="assessment-level">Difficulty level</label>

        <select
          id="assessment-level"
          value={selectedLevel}
          disabled={busy}
          onChange={(event) => {
            const level = event.target.value;
            setSelectedLevel(level);
            start(level);
          }}
        >
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <p className="small muted">
          Changing the level starts a new assessment.
        </p>
      </div>

      <div
        className="row"
        style={{ justifyContent: "space-between", gap: 12 }}
      >
        <p className="eyebrow">
          Question {index + 1} of {questions.length}
        </p>

        <strong>{progress}% answered</strong>
      </div>

      <div
        className="bar"
        role="progressbar"
        aria-label="Assessment completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        style={{ marginBottom: 20 }}
      >
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="card">
        <p className="eyebrow">
          {question.dimension || question.skill || "General"}
          {" · "}
          {question.level || selectedLevel}
        </p>

        <h2 style={{ fontSize: "1.6rem", lineHeight: 1.35 }}>
          {question.prompt}
        </h2>

        <div
          role="radiogroup"
          aria-label="Answer choices"
          style={{ marginTop: 18 }}
        >
          {(question.options || []).map((option, optionIndex) => {
            const selected = answers[question.id] === optionIndex;

            return (
              <button
                type="button"
                key={optionIndex}
                role="radio"
                aria-checked={selected}
                className={`option ${selected ? "on" : ""}`}
                onClick={() =>
                  setAnswers((previous) => ({
                    ...previous,
                    [question.id]: optionIndex,
                  }))
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 10,
                }}
              >
                <strong>{LETTERS[optionIndex]}.</strong> {option}
              </button>
            );
          })}
        </div>

        {err && (
          <p role="alert" style={{ color: "var(--bad-t)" }}>
            {err}
          </p>
        )}

        <div
          className="row"
          style={{ marginTop: 18, flexWrap: "wrap", gap: 12 }}
        >
          {index > 0 && (
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => setIndex((value) => value - 1)}
            >
              Previous
            </button>
          )}

          {!last ? (
            <button
              type="button"
              className="btn primary"
              disabled={
                answers[question.id] === undefined || busy
              }
              onClick={() => setIndex((value) => value + 1)}
            >
              Next question
            </button>
          ) : (
            <button
              type="button"
              className="btn primary"
              disabled={
                busy ||
                !questions.every((item) =>
                  Number.isInteger(answers[item.id])
                )
              }
              onClick={submit}
            >
              {busy ? "Grading..." : "Submit assessment"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function Assessment() {
  return (
    <Suspense fallback={<Loading label="Loading assessment..." />}>
      <Exam />
    </Suspense>
  );
}
