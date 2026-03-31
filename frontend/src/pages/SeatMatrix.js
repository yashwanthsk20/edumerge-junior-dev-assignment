import React, { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import ui from "../components/ui.module.css";
import s from "./SeatMatrix.module.css";

export default function SeatMatrix() {
  const { user } = useAuth();
  const [matrices, setMatrices]   = useState([]);
  const [programs, setPrograms]   = useState([]);
  const [years, setYears]         = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ program: "", academicYear: "", quotas: [{ quota: "KCET", total: "" }, { quota: "COMEDK", total: "" }, { quota: "Management", total: "" }] });
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [loading, setLoading]     = useState(true);

  const load = () => {
    Promise.all([API.get("/seat-matrix"), API.get("/programs"), API.get("/academic-years")])
      .then(([sm, p, y]) => { setMatrices(sm.data); setPrograms(p.data); setYears(y.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const selectedProg = programs.find(p => p._id === form.program);
  const quotaSum = form.quotas.reduce((s, q) => s + (Number(q.total) || 0), 0);
  const intakeMismatch = selectedProg && quotaSum !== selectedProg.totalIntake;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (intakeMismatch) {
      setError(`Quota total (${quotaSum}) must equal program intake (${selectedProg.totalIntake})`);
      return;
    }
    try {
      await API.post("/seat-matrix", form);
      setSuccess("✅ Seat matrix saved successfully");
      setShowForm(false);
      setForm({ program: "", academicYear: "", quotas: [{ quota: "KCET", total: "" }, { quota: "COMEDK", total: "" }, { quota: "Management", total: "" }] });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    }
  };

  const updateQuota = (i, val) => {
    const q = [...form.quotas];
    q[i] = { ...q[i], total: val };
    setForm({ ...form, quotas: q });
  };

  const canEdit = user?.role === "admin";

  return (
    <div>
      <div className={ui.cardHeader}>
        <h2 className={s.heading}>🪑 Seat Matrix & Quota</h2>
        {canEdit && (
          <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => setShowForm(v => !v)}>
            {showForm ? "Cancel" : "+ Configure Seats"}
          </button>
        )}
      </div>

      {error   && <div className={`${ui.alert} ${ui.alertError}`}>{error}</div>}
      {success && <div className={`${ui.alert} ${ui.alertSuccess}`}>{success}</div>}

      {/* Form */}
      {showForm && canEdit && (
        <div className={ui.card}>
          <div className={ui.cardHeader}><span className={ui.cardTitle}>Configure Seat Matrix</span></div>
          <form onSubmit={handleSubmit}>
            <div className={ui.formGrid}>
              <div className={ui.formGroup}>
                <label className={ui.label}>Program *</label>
                <select className={ui.select} required value={form.program}
                  onChange={e => setForm({ ...form, program: e.target.value })}>
                  <option value="">-- Select Program --</option>
                  {programs.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.code}) — Intake: {p.totalIntake}</option>
                  ))}
                </select>
              </div>
              <div className={ui.formGroup}>
                <label className={ui.label}>Academic Year *</label>
                <select className={ui.select} required value={form.academicYear}
                  onChange={e => setForm({ ...form, academicYear: e.target.value })}>
                  <option value="">-- Select Year --</option>
                  {years.map(y => <option key={y._id} value={y._id}>{y.label}</option>)}
                </select>
              </div>
            </div>

            {selectedProg && (
              <div className={s.intakeInfo}>
                Total Intake for <strong>{selectedProg.name}</strong>: <strong>{selectedProg.totalIntake} seats</strong>
                &nbsp;| Quota sum: <strong style={{ color: intakeMismatch ? "var(--accent)" : "var(--success)" }}>{quotaSum}</strong>
                {intakeMismatch && <span style={{ color: "var(--accent)", marginLeft: 8 }}>⚠ Must equal {selectedProg.totalIntake}</span>}
              </div>
            )}

            <div className={s.quotaGrid}>
              {form.quotas.map((q, i) => (
                <div key={q.quota} className={s.quotaCard}>
                  <div className={s.quotaName}>{q.quota}</div>
                  <input
                    className={ui.input}
                    type="number" min="0" required
                    placeholder="Seats"
                    value={q.total}
                    onChange={e => updateQuota(i, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button className={`${ui.btn} ${ui.btnPrimary}`} type="submit">Save Matrix</button>
            </div>
          </form>
        </div>
      )}

      {/* Matrix Table */}
      {loading ? (
        <div className={ui.spinner}>Loading...</div>
      ) : matrices.length === 0 ? (
        <div className={ui.card}><div className={ui.empty}>No seat matrix configured yet. Click '+ Configure Seats' to begin.</div></div>
      ) : (
        matrices.map(sm => (
          <div key={sm._id} className={ui.card}>
            <div className={ui.cardHeader}>
              <span className={ui.cardTitle}>
                {sm.program?.name} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>({sm.program?.code}) · {sm.academicYear?.label}</span>
              </span>
              <span className={`${ui.badge} ${ui.badgeBlue}`}>Total Intake: {sm.program?.totalIntake}</span>
            </div>
            <div className={s.quotaStats}>
              {sm.quotas.map(q => {
                const pct = q.total > 0 ? Math.round((q.allocated / q.total) * 100) : 0;
                return (
                  <div key={q.quota} className={s.quotaStat}>
                    <div className={s.quotaStatName}>{q.quota}</div>
                    <div className={s.quotaStatNums}>
                      <span>{q.allocated}</span>
                      <span style={{ color: "var(--text-muted)" }}>/</span>
                      <span>{q.total}</span>
                    </div>
                    <div className={s.progressBar}>
                      <div className={s.progressFill}
                        style={{ width: `${pct}%`, background: pct >= 100 ? "var(--accent)" : "var(--primary)" }} />
                    </div>
                    <div className={s.quotaRemain}>
                      {q.total - q.allocated > 0
                        ? <span className={`${ui.badge} ${ui.badgeGreen}`}>{q.total - q.allocated} left</span>
                        : <span className={`${ui.badge} ${ui.badgeRed}`}>FULL</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
