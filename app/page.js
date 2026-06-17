'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    regNumber: '',
    course: '',
    yearOfStudy: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [cr, setCr] = useState(null);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function lookupCR(course) {
    const trimmed = course.trim();
    if (!trimmed) {
      setCr(null);
      return;
    }
    try {
      const res = await fetch(`/api/cr?course=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setCr(data.cr || null);
    } catch {
      setCr(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    if (!/^[0-9]{8,15}$/.test(form.regNumber.trim())) {
      setStatus({
        kind: 'error',
        message: 'Registration number must be 8–15 digits.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        form.name.trim(),
          regNumber:   form.regNumber.trim(),
          course:      form.course.trim(),
          yearOfStudy: Number(form.yearOfStudy),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({
          kind: 'error',
          message: data.error || `Registration failed (${res.status}).`,
        });
        return;
      }

      const isCR = data.student?.role === 'cr';
      setStatus({
        kind: 'success',
        message: isCR
          ? 'Registered! You are the Class Representative — open the app to create attendance sessions.'
          : 'Registered! Open the Campus Smart Access app and sign in with your reg number.',
      });
      setForm({ name: '', regNumber: '', course: '', yearOfStudy: '' });
      setCr(null);
    } catch (err) {
      setStatus({
        kind: 'error',
        message: `Could not reach the server: ${err.message || err}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <header className="hero">
          <div className="logo-dot" />
          <span className="logo-text">CampusID</span>
        </header>

        <h1 className="title">Create your student account</h1>
        <p className="subtitle">
          Register once. Your reg number is your campus ID sign in on the
          mobile app with the same number to mark attendance via QR.
        </p>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="label">Full name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Alex Rivers"
              autoComplete="name"
              required
            />
          </label>

          <label className="field">
            <span className="label">Registration number</span>
            <input
              type="text"
              value={form.regNumber}
              onChange={(e) => update('regNumber', e.target.value)}
              placeholder="e.g. 23062313037"
              inputMode="numeric"
              pattern="[0-9]{8,15}"
              autoComplete="username"
              required
            />
            <span className="hint">Digits only, 8–15 characters.</span>
          </label>

          <div className="row">
            <label className="field">
              <span className="label">Course</span>
              <input
                type="text"
                value={form.course}
                onChange={(e) => update('course', e.target.value)}
                onBlur={(e) => lookupCR(e.target.value)}
                placeholder="Computer Science"
                required
              />
            </label>
            <label className="field">
              <span className="label">Year of study</span>
              <select
                value={form.yearOfStudy}
                onChange={(e) => update('yearOfStudy', e.target.value)}
                required
              >
                <option value="">Select…</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
                <option value="6">Year 6</option>
              </select>
            </label>
          </div>

          {cr && (
            <div className="cr-info">
              Class Rep: {cr.name} ({cr.regNumber})
            </div>
          )}

          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Registering…' : 'Register'}
          </button>

          {status && (
            <div className={`status ${status.kind}`}>{status.message}</div>
          )}
        </form>

        <footer className="foot">
          <span className="muted small">
            Already registered? Sign in from the Campus Smart Access app.
          </span>
        </footer>
      </section>
    </main>
  );
}
