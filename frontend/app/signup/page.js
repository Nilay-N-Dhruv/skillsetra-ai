"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import AuthShell from "@/components/AuthShell";
import { publicGet } from "@/lib/api";
import VerifyEmailModal from "@/components/VerifyEmailModal";

const EXPERIENCE = ["Student", "Early career", "Mid-level", "Senior"];
const STATUS = ["Student", "Working", "Between jobs", "Other"];
const STEPS = ["Account", "About you", "Target role"];
const COLORS = ["#f87171", "#fbbf24", "#fbbf24", "#34d399", "#34d399"];

const score = (p) =>
  [
    p.length >= 8,
    /[a-z]/.test(p) && /[A-Z]/.test(p),
    /\d/.test(p),
    /[^A-Za-z0-9]/.test(p),
  ].filter(Boolean).length;

const ageOf = (d) =>
  Math.floor(
    (Date.now() - new Date(d).getTime()) / 31557600000
  );

export default function Signup() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState(null);

  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    status: "Student",
    experience: "Early career",
    country: "",
    target_role: "",
    goal: "Become job-ready with credible evidence",
    consent: false,
  });

  const [show, setShow] = useState(false);
  const [err, setErr] = useState(null);
  const [verify, setVerify] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) =>
    setF({
      ...f,
      [k]:
        e.target.type === "checkbox"
          ? e.target.checked
          : e.target.value,
    });

  const loadRoles = () =>
    publicGet("/roles")
      .then((d) => setRoles(d.roles))
      .catch(() => setRoles(false));

  useEffect(() => {
    loadRoles();
  }, []);

  function check() {
    if (step === 0) {
      if (!f.name.trim()) {
        return "Enter your name.";
      }

      if (!/^\S+@\S+\.\S+$/.test(f.email)) {
        return "Enter a valid email address.";
      }

      if (
        f.password.length < 8 ||
        score(f.password) < 3
      ) {
        return "Use at least 8 characters with 3 of: upper and lower case, a number, a symbol.";
      }
    }

    if (step === 1) {
      if (!f.dob) {
        return "Enter your date of birth.";
      }

      const a = ageOf(f.dob);

      if (!(a >= 13 && a <= 100)) {
        return "You must be at least 13 years old to create an account.";
      }
    }

    if (step === 2) {
      if (!f.target_role) {
        return "Choose the role you want to prove.";
      }

      if (!f.consent) {
        return "Please accept the terms and privacy notice to continue.";
      }
    }

    return null;
  }

  const next = () => {
    const m = check();

    setErr(m);

    if (!m) {
      setStep(step + 1);
    }
  };

  async function finish() {
    const m = check();

    setErr(m);

    if (m) return;

    setBusy(true);

    try {
      const {
        name,
        dob,
        status,
        experience,
        country,
        target_role,
        goal,
        consent,
      } = f;

      const r = await signUp(
        f.email.trim(),
        f.password,
        name.trim(),
        {
          name: name.trim(),
          dob,
          status,
          experience,
          country,
          target_role,
          goal,
          consent,
        }
      );

      if (r.exists) {
        setErr(
          "An account with this email already exists. Try signing in."
        );
      } else if (r.needsConfirm) {
        setVerify(f.email.trim());
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setErr(e.message);
    }

    setBusy(false);
  }

  const role =
    roles &&
    roles.find(
      (r) => r.name === f.target_role
    );

  const s = score(f.password);

  const minor =
    f.dob &&
    ageOf(f.dob) >= 13 &&
    ageOf(f.dob) < 18;

  return (
    <AuthShell
      wide
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </>
      }
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        <div
          className="steps"
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
          style={{
            width: "100%",
            marginBottom: 36,
          }}
        >
          {STEPS.map((l, i) => (
            <Fragment key={l}>
              <div
                className={`stepdot ${
                  i === step ? "on" : ""
                } ${i < step ? "done" : ""}`}
              >
                <b>
                  {i < step ? (
                    <Check
                      size={14}
                      aria-hidden
                    />
                  ) : (
                    i + 1
                  )}
                </b>

                <span>{l}</span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={`stepline ${
                    i < step ? "done" : ""
                  }`}
                />
              )}
            </Fragment>
          ))}
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: step === 2 ? 700 : 550,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          {step === 0 && (
            <div>
              <p className="eyebrow">
                Create your account
              </p>

              <h2>
                Start with what you want to prove.
              </h2>

              <div style={{ textAlign: "left" }}>
                <label htmlFor="n">
                  Full name
                </label>

                <input
                  id="n"
                  autoComplete="name"
                  value={f.name}
                  onChange={set("name")}
                  maxLength={80}
                />

                <label htmlFor="e">
                  Email
                </label>

                <input
                  id="e"
                  type="email"
                  autoComplete="email"
                  value={f.email}
                  onChange={set("email")}
                />

                <label htmlFor="p">
                  Password
                </label>

                <div className="pw">
                  <input
                    id="p"
                    type={
                      show
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={f.password}
                    onChange={set("password")}
                  />

                  <button
                    type="button"
                    className="btn"
                    aria-label={
                      show
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShow(!show)
                    }
                  >
                    {show ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>

                <div
                  className="strength"
                  aria-hidden
                >
                  <i
                    style={{
                      width: `${s * 25}%`,
                      background: COLORS[s],
                    }}
                  />
                </div>

                <p
                  className="small muted"
                  style={{
                    marginTop: 6,
                  }}
                >
                  At least 8 characters, with 3
                  of: upper and lower case, a
                  number, a symbol.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="eyebrow">
                About you
              </p>

              <h2>
                Help us set the right starting
                point.
              </h2>

              <div style={{ textAlign: "left" }}>
                <label htmlFor="d">
                  Date of birth
                </label>

                <input
                  id="d"
                  type="date"
                  value={f.dob}
                  onChange={set("dob")}
                  max={new Date()
                    .toISOString()
                    .slice(0, 10)}
                />

                {minor && (
                  <p
                    className="small muted"
                    style={{
                      marginTop: 8,
                    }}
                  >
                    You are under 18. Your data
                    stays private to your account
                    and is never shared.
                  </p>
                )}

                <label htmlFor="s">
                  Current status
                </label>

                <select
                  id="s"
                  value={f.status}
                  onChange={set("status")}
                >
                  {STATUS.map((x) => (
                    <option key={x}>
                      {x}
                    </option>
                  ))}
                </select>

                <label htmlFor="x">
                  Experience level
                </label>

                <select
                  id="x"
                  value={f.experience}
                  onChange={set("experience")}
                >
                  {EXPERIENCE.map((x) => (
                    <option key={x}>
                      {x}
                    </option>
                  ))}
                </select>

                <label htmlFor="c">
                  Country (optional)
                </label>

                <input
                  id="c"
                  value={f.country}
                  onChange={set("country")}
                  maxLength={60}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="eyebrow">
                Target role
              </p>

              <h2>
                What role are you preparing for?
              </h2>

              <p className="muted">
                This becomes the reference point
                for your assessment and learning
                recommendations.
              </p>

              {roles === null && (
                <p className="muted">
                  Loading roles…
                </p>
              )}

              {roles === false && (
                <p role="alert">
                  We couldn't load the roles.{" "}
                  <button
                    type="button"
                    className="btn"
                    onClick={loadRoles}
                  >
                    Try again
                  </button>
                </p>
              )}

              {roles && (
                <div className="roles">
                  {roles.map((r) => (
                    <button
                      key={r.name}
                      type="button"
                      className="rolebtn"
                      aria-pressed={
                        f.target_role ===
                        r.name
                      }
                      onClick={() =>
                        setF({
                          ...f,
                          target_role: r.name,
                        })
                      }
                    >
                      <strong>
                        {r.name}
                      </strong>

                      <small>
                        {r.skills
                          .slice(0, 3)
                          .join(" · ")}
                      </small>
                    </button>
                  ))}
                </div>
              )}

              {role && (
                <div
                  className="card"
                  style={{
                    marginTop: 16,
                    background:
                      "var(--soft)",
                    textAlign: "left",
                  }}
                  aria-live="polite"
                >
                  <h3>{role.name}</h3>

                  <p>{role.summary}</p>

                  <p
                    className="small muted"
                    style={{
                      marginBottom: 6,
                    }}
                  >
                    Skills you will be
                    assessed on
                  </p>

                  <div
                    className="strip"
                    style={{
                      marginTop: 0,
                    }}
                  >
                    {role.skills.map((x) => (
                      <span
                        className="chip"
                        key={x}
                      >
                        {x}
                      </span>
                    ))}
                  </div>

                  <p className="small">
                    <strong>
                      Common tools:
                    </strong>{" "}
                    {role.tools.join(", ")}
                  </p>

                  <p
                    className="small"
                    style={{
                      marginBottom: 0,
                    }}
                  >
                    <strong>
                      Projects that prove it:
                    </strong>{" "}
                    {role.projects.join(
                      " · "
                    )}
                  </p>
                </div>
              )}

              <div
                style={{
                  textAlign: "left",
                }}
              >
                <label htmlFor="g">
                  Primary goal
                </label>

                <input
                  id="g"
                  value={f.goal}
                  onChange={set("goal")}
                  maxLength={160}
                />

                <label
                  className="chk"
                  style={{
                    marginTop: 16,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={f.consent}
                    onChange={set("consent")}
                  />

                  <span>
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      privacy notice
                    </Link>
                    .
                  </span>
                </label>
              </div>
            </div>
          )}

          {err && (
            <p
              role="alert"
              style={{
                color: "var(--bad-t)",
                textAlign: "left",
                marginTop: 18,
              }}
            >
              {err}
            </p>
          )}

          <div
            className="row"
            style={{
              marginTop: 22,
              justifyContent:
                step > 0
                  ? "space-between"
                  : "center",
            }}
          >
            {step > 0 && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setErr(null);
                  setStep(step - 1);
                }}
              >
                Back
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                className="btn primary"
                onClick={next}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="btn primary"
                onClick={finish}
                disabled={busy}
              >
                {busy
                  ? "Creating…"
                  : "Create account"}
              </button>
            )}
          </div>
        </div>
      </div>

      {verify && (
        <VerifyEmailModal email={verify} />
      )}
    </AuthShell>
  );
}