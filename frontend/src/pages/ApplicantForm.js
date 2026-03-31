import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import ui from "../components/ui.module.css";
import s from "./ApplicantForm.module.css";

const INITIAL = {
  firstName: "", lastName: "", email: "", phone: "",
  dob: "", gender: "Male", category: "GM",
  entryType: "Regular", quota: "KCET", admissionMode: "Government",
  program: "", academicYear: "",
  allotmentNumber: "", marksObtained: "", maxMarks: "",
};

export default function ApplicantForm() {
  const navigate = useNavigate();
  const [form, setForm]         = useState(INITIAL);
  const [programs, setPrograms] = useState([]);
  const [years, setYears]       = useState([]);
  const [seatInfo, setSeatInfo] = useState(null);
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    Promise.all([API.get("/programs"), API.get("/academic-years")])
      .then(([p, y]) => { setPrograms(p.data); setYears(y.data); });
  }, []);

  // Load seat availability when program + year + quota selected
  useEffect(() => {
    if (form.program && form.academicYear && form.quota) {
      API.get(`/seat-matrix/program/${form.program}/year/${form.academicYear}`)
        .then(r => {
          if (r.data) {
            const q = r.data.quotas.find(q => q.quota === form.quota);
            setSeatInfo(q ? { total: q.total, remaining: q.total - q.allocated } : null);
          } else setSeatInfo(null);
        })
        .catch(() => setSeatInfo(null));
    } else {
      setSeatInfo(null);
    }
  }, [form.program, form.academicYear, form.quota]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      await API.post("/applicants", form);
      navigate("/applicants");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create applicant");
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className={s.header}>
        <button className={`${ui.btn} ${ui.btnOutline}`} onClick={() => navigate("/applicants")}>
          ← Back
        </button>
        <h2 className={s.heading}>📝 New Applicant</h2>
      </div>

      {error && <div className={`${ui.alert} ${ui.alertError}`}>{error}</div>}

      {/* Seat availability indicator */}
      {seatInfo !== null && (
        <div className={`${ui.alert} ${seatInfo.remaining > 0 ? ui.alertSuccess : ui.alertError}`}>
          {seatInfo.remaining > 0
            ? `✅ ${seatInfo.remaining} of ${seatInfo.total} seats available in ${form.quota} quota`
            : `❌ No seats available in ${form.quota} quota — allocation will be blocked`}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Details */}
        <div className={ui.card}>
          <div className={ui.cardHeader}><span className={ui.cardTitle}>Personal Details</span></div>
          <div className={ui.formGrid}>
            <div className={ui.formGroup}>
              <label className={ui.label}>First Name *</label>
              <input className={ui.input} required value={form.firstName}
                onChange={e => set("firstName", e.target.value)} />
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Last Name *</label>
              <input className={ui.input} required value={form.lastName}
                onChange={e => set("lastName", e.target.value)} />
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Email *</label>
              <input className={ui.input} type="email" required value={form.email}
                onChange={e => set("email", e.target.value)} />
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Phone *</label>
              <input className={ui.input} required value={form.phone}
                onChange={e => set("phone", e.target.value)} />
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Date of Birth</label>
              <input className={ui.input} type="date" value={form.dob}
                onChange={e => set("dob", e.target.value)} />
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Gender</label>
              <select className={ui.select} value={form.gender} onChange={e => set("gender", e.target.value)}>
                {["Male","Female","Other"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Admission Details */}
        <div className={ui.card}>
          <div className={ui.cardHeader}><span className={ui.cardTitle}>Admission Details</span></div>
          <div className={ui.formGrid}>
            <div className={ui.formGroup}>
              <label className={ui.label}>Category *</label>
              <select className={ui.select} required value={form.category} onChange={e => set("category", e.target.value)}>
                {["GM","SC","ST","OBC","EWS"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Admission Mode *</label>
              <select className={ui.select} required value={form.admissionMode} onChange={e => set("admissionMode", e.target.value)}>
                {["Government","Management"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Entry Type *</label>
              <select className={ui.select} required value={form.entryType} onChange={e => set("entryType", e.target.value)}>
                {["Regular","Lateral"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Quota *</label>
              <select className={ui.select} required value={form.quota} onChange={e => set("quota", e.target.value)}>
                {["KCET","COMEDK","Management"].map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Program *</label>
              <select className={ui.select} required value={form.program} onChange={e => set("program", e.target.value)}>
                <option value="">-- Select Program --</option>
                {programs.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code}) — {p.courseType}</option>
                ))}
              </select>
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Academic Year *</label>
              <select className={ui.select} required value={form.academicYear} onChange={e => set("academicYear", e.target.value)}>
                <option value="">-- Select Year --</option>
                {years.map(y => (
                  <option key={y._id} value={y._id}>{y.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.admissionMode === "Government" && (
            <div className={ui.formGroup}>
              <label className={ui.label}>Allotment Number (KCET/COMEDK)</label>
              <input className={ui.input} value={form.allotmentNumber}
                onChange={e => set("allotmentNumber", e.target.value)}
                placeholder="e.g. KCT2026XXXXX" />
            </div>
          )}

          <div className={ui.formGrid}>
            <div className={ui.formGroup}>
              <label className={ui.label}>Marks Obtained</label>
              <input className={ui.input} type="number" value={form.marksObtained}
                onChange={e => set("marksObtained", e.target.value)} />
            </div>
            <div className={ui.formGroup}>
              <label className={ui.label}>Max Marks</label>
              <input className={ui.input} type="number" value={form.maxMarks}
                onChange={e => set("maxMarks", e.target.value)} />
            </div>
          </div>
        </div>

        <div className={s.actions}>
          <button type="button" className={`${ui.btn} ${ui.btnOutline}`} onClick={() => navigate("/applicants")}>
            Cancel
          </button>
          <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`} disabled={saving}>
            {saving ? "Saving..." : "Create Applicant"}
          </button>
        </div>
      </form>
    </div>
  );
}
