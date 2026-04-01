import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import ui from "../components/ui.module.css";
import s from "./ApplicantDetail.module.css";

const STEPS = ["Applied","SeatAllocated","DocumentsVerified","FeePaid","Admitted"];

const DOC_LABELS = {
  tenthMarksheet:   "10th Marksheet",
  twelfthMarksheet: "12th Marksheet",
  transferCert:     "Transfer Certificate",
  casteCert:        "Caste Certificate",
  photo:            "Passport Photo",
};

export default function ApplicantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState({ type: "", text: "" });
  const [busy, setBusy]           = useState("");

  const canEdit = user?.role !== "management";

  const load = useCallback(() => {
    API.get(`/applicants/${id}`)
      .then(r => setApplicant(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const notify = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const allocateSeat = async () => {
    setBusy("seat");
    try {
      const r = await API.post(`/applicants/${id}/allocate-seat`);
      notify("success", `✅ ${r.data.message} — ${r.data.remaining} seats remaining`);
      load();
    } catch (err) {
      notify("error", err.response?.data?.error || "Allocation failed");
    } finally { setBusy(""); }
  };

  const updateDoc = async (field, value) => {
    setBusy("doc");
    try {
      await API.patch(`/applicants/${id}/documents`, { [field]: value });
      load();
    } catch (err) {
      notify("error", err.response?.data?.error || "Update failed");
    } finally { setBusy(""); }
  };

  const markFeePaid = async () => {
    setBusy("fee");
    try {
      await API.patch(`/applicants/${id}/fee`, {});
      notify("success", "✅ Fee marked as Paid");
      load();
    } catch (err) {
      notify("error", err.response?.data?.error || "Fee update failed");
    } finally { setBusy(""); }
  };

  const confirmAdmission = async () => {
    setBusy("confirm");
    try {
      const r = await API.post(`/applicants/${id}/confirm-admission`);
      notify("success", `🎉 ${r.data.message} — ${r.data.admissionNumber}`);
      load();
    } catch (err) {
      notify("error", err.response?.data?.error || "Confirmation failed");
    } finally { setBusy(""); }
  };

  if (loading) return <div className={ui.spinner}>Loading...</div>;
  if (!applicant) return <div className={ui.empty}>Applicant not found</div>;

  const stepIdx = STEPS.indexOf(applicant.status);

  return (
    <div>
      <div className={s.header}>
        <button className={`${ui.btn} ${ui.btnOutline}`} onClick={() => navigate("/applicants")}>
          ← Back
        </button>
        <div>
          <h2 className={s.heading}>{applicant.firstName} {applicant.lastName}</h2>
          <p className={s.sub}>{applicant.email} · {applicant.phone}</p>
        </div>
        {applicant.admissionNumber && (
          <div className={s.admissionBadge}>
            <div className={s.admLabel}>Admission No.</div>
            <div className={s.admNo}>{applicant.admissionNumber}</div>
          </div>
        )}
      </div>

      {/* Alert */}
      {msg.text && (
        <div className={`${ui.alert} ${msg.type === "error" ? ui.alertError : ui.alertSuccess}`}>
          {msg.text}
        </div>
      )}

      {/* Workflow steps */}
      <div className={ui.steps}>
        {STEPS.map((st, i) => (
          <div
            key={st}
            className={`${ui.step} ${i < stepIdx ? ui.stepDone : ""} ${i === stepIdx ? ui.stepActive : ""}`}
          >
            {i < stepIdx ? "✓ " : ""}{st}
          </div>
        ))}
      </div>

      <div className={s.grid}>
        {/* Left: Info + Actions */}
        <div>
          {/* Basic Info */}
          <div className={ui.card}>
            <div className={ui.cardHeader}><span className={ui.cardTitle}>Admission Info</span></div>
            <table className={s.infoTable}>
              <tbody>
                <tr><td>Program</td><td><strong>{applicant.program?.name}</strong></td></tr>
                <tr><td>Academic Year</td><td>{applicant.academicYear?.label}</td></tr>
                <tr><td>Quota</td><td><span className={`${ui.badge} ${ui.badgeBlue}`}>{applicant.quota}</span></td></tr>
                <tr><td>Category</td><td><span className={`${ui.badge} ${ui.badgeGray}`}>{applicant.category}</span></td></tr>
                <tr><td>Entry Type</td><td>{applicant.entryType}</td></tr>
                <tr><td>Admission Mode</td><td>{applicant.admissionMode}</td></tr>
                {applicant.allotmentNumber && <tr><td>Allotment No.</td><td>{applicant.allotmentNumber}</td></tr>}
                <tr><td>Marks</td><td>{applicant.marksObtained || "—"} / {applicant.maxMarks || "—"}</td></tr>
                <tr>
                  <td>Fee Status</td>
                  <td>
                    <span className={`${ui.badge} ${applicant.feeStatus === "Paid" ? ui.badgeGreen : ui.badgeRed}`}>
                      {applicant.feeStatus}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Seat Locked</td>
                  <td>
                    <span className={`${ui.badge} ${applicant.seatLocked ? ui.badgeGreen : ui.badgeGray}`}>
                      {applicant.seatLocked ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          {canEdit && (
            <div className={ui.card}>
              <div className={ui.cardHeader}><span className={ui.cardTitle}>Actions</span></div>
              <div className={s.actions}>
                {/* Allocate Seat */}
                {!applicant.seatLocked && (
                  <button
                    className={`${ui.btn} ${ui.btnPrimary}`}
                    onClick={allocateSeat}
                    disabled={busy === "seat"}
                  >
                    🪑 {busy === "seat" ? "Allocating..." : "Allocate Seat"}
                  </button>
                )}

                {/* Mark Fee Paid */}
                {applicant.seatLocked && applicant.feeStatus === "Pending" && (
                  <button
                    className={`${ui.btn} ${ui.btnSuccess}`}
                    onClick={markFeePaid}
                    disabled={busy === "fee"}
                  >
                    💰 {busy === "fee" ? "Updating..." : "Mark Fee Paid"}
                  </button>
                )}

                {/* Confirm Admission */}
                {applicant.seatLocked && applicant.feeStatus === "Paid" && !applicant.admissionNumber && (
                  <button
                    className={`${ui.btn} ${ui.btnPrimary}`}
                    onClick={confirmAdmission}
                    disabled={busy === "confirm"}
                    style={{ background: "#1b5e20" }}
                  >
                    🎓 {busy === "confirm" ? "Confirming..." : "Confirm Admission"}
                  </button>
                )}

                {applicant.status === "Admitted" && (
                  <div className={`${ui.alert} ${ui.alertSuccess}`} style={{ margin: 0 }}>
                    🎉 Admission Confirmed: <strong>{applicant.admissionNumber}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Documents */}
        <div className={ui.card}>
          <div className={ui.cardHeader}><span className={ui.cardTitle}>📂 Document Checklist</span></div>
          <div className={s.docList}>
            {Object.entries(DOC_LABELS).map(([field, label]) => {
              const status = applicant.documents?.[field] || "Pending";
              return (
                <div key={field} className={s.docRow}>
                  <span className={s.docLabel}>{label}</span>
                  <span className={`${ui.badge} ${
                    status === "Verified"  ? ui.badgeGreen :
                    status === "Submitted" ? ui.badgeBlue  : ui.badgeGray
                  }`}>
                    {status}
                  </span>
                  {canEdit && (
                    <select
                      className={ui.select}
                      style={{ width: 130, padding: "4px 8px" }}
                      value={status}
                      disabled={busy === "doc"}
                      onChange={e => updateDoc(field, e.target.value)}
                    >
                      {["Pending","Submitted","Verified"].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
