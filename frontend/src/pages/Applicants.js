import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";
import ui from "../components/ui.module.css";
import s from "./Applicants.module.css";

const STATUS_BADGE = {
  Applied:           ui.badgeGray,
  SeatAllocated:     ui.badgeBlue,
  DocumentsVerified: ui.badgePurple,
  FeePaid:           ui.badgeYellow,
  Admitted:          ui.badgeGreen,
  Cancelled:         ui.badgeRed,
};

export default function Applicants() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState({ status: "", quota: "" });

  const load = () => {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.quota)  params.set("quota", filter.quota);
    API.get(`/applicants?${params.toString()}`)
      .then(r => setApplicants(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  const canEdit = user?.role !== "management";

  return (
    <div>
      <div className={ui.cardHeader}>
        <h2 className={s.heading}>👥 Applicants</h2>
        {canEdit && (
          <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => navigate("/applicants/new")}>
            + New Applicant
          </button>
        )}
      </div>

      {/* Filters */}
      <div className={s.filters}>
        <select className={ui.select} style={{ width: 180 }}
          value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          {["Applied","SeatAllocated","DocumentsVerified","FeePaid","Admitted","Cancelled"].map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
        <select className={ui.select} style={{ width: 160 }}
          value={filter.quota} onChange={e => setFilter({ ...filter, quota: e.target.value })}>
          <option value="">All Quotas</option>
          {["KCET","COMEDK","Management"].map(q => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
        <button className={`${ui.btn} ${ui.btnOutline}`} onClick={() => setFilter({ status: "", quota: "" })}>
          Clear
        </button>
      </div>

      <div className={ui.card}>
        {loading ? (
          <div className={ui.spinner}>Loading...</div>
        ) : applicants.length === 0 ? (
          <div className={ui.empty}>No applicants found. {canEdit && "Click '+ New Applicant' to add one."}</div>
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Program</th>
                <th>Quota</th>
                <th>Category</th>
                <th>Status</th>
                <th>Fee</th>
                <th>Admission No.</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map(a => (
                <tr key={a._id}>
                  <td>
                    <strong>{a.firstName} {a.lastName}</strong>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.email}</div>
                  </td>
                  <td>{a.program?.code || "—"}</td>
                  <td><span className={`${ui.badge} ${ui.badgeBlue}`}>{a.quota}</span></td>
                  <td><span className={`${ui.badge} ${ui.badgeGray}`}>{a.category}</span></td>
                  <td>
                    <span className={`${ui.badge} ${STATUS_BADGE[a.status] || ui.badgeGray}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <span className={`${ui.badge} ${a.feeStatus === "Paid" ? ui.badgeGreen : ui.badgeRed}`}>
                      {a.feeStatus}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 11 }}>
                    {a.admissionNumber || "—"}
                  </td>
                  <td>
                    <button
                      className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                      onClick={() => navigate(`/applicants/${a._id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
