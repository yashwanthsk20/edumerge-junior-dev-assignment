import React, { useEffect, useState } from "react";
import API from "../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ui from "../components/ui.module.css";
import s from "./Dashboard.module.css";

const statusColors = {
  Applied: "#90a4ae", SeatAllocated: "#42a5f5",
  DocumentsVerified: "#ab47bc", FeePaid: "#ffa726", Admitted: "#66bb6a",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/dashboard")
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={ui.spinner}>⏳ Loading dashboard...</div>;

  const statusData = data?.statusBreakdown
    ? Object.entries(data.statusBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const quotaChartData = data?.quotaStats?.flatMap(prog =>
    prog.quotas.map(q => ({
      name: `${prog.programCode}/${q.quota}`,
      Allocated: q.allocated,
      Remaining: q.remaining,
    }))
  ) || [];

  return (
    <div>
      <h2 className={s.heading}>📊 Dashboard</h2>

      {/* Stat cards */}
      <div className={ui.statGrid}>
        <div className={ui.statCard} style={{ borderTopColor: "#1a237e" }}>
          <div className={ui.statValue}>{data?.total ?? 0}</div>
          <div className={ui.statLabel}>Total Applicants</div>
        </div>
        <div className={ui.statCard} style={{ borderTopColor: "#2e7d32" }}>
          <div className={ui.statValue}>{data?.admitted ?? 0}</div>
          <div className={ui.statLabel}>Admitted</div>
        </div>
        <div className={ui.statCard} style={{ borderTopColor: "#f57c00" }}>
          <div className={ui.statValue}>{data?.feePending ?? 0}</div>
          <div className={ui.statLabel}>Fee Pending</div>
        </div>
        <div className={ui.statCard} style={{ borderTopColor: "#e53935" }}>
          <div className={ui.statValue}>{data?.docPending ?? 0}</div>
          <div className={ui.statLabel}>Docs Pending</div>
        </div>
      </div>

      <div className={s.charts}>
        {/* Quota fill chart */}
        <div className={ui.card}>
          <div className={ui.cardHeader}>
            <span className={ui.cardTitle}>🪑 Quota-wise Seat Fill</span>
          </div>
          {quotaChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={quotaChartData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Allocated" fill="#1a237e" />
                <Bar dataKey="Remaining" fill="#e8eaf6" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className={ui.empty}>No seat matrix configured yet</div>}
        </div>

        {/* Status breakdown */}
        <div className={ui.card}>
          <div className={ui.cardHeader}>
            <span className={ui.cardTitle}>📋 Applicant Pipeline</span>
          </div>
          <div className={s.pipeline}>
            {statusData.map(item => (
              <div key={item.name} className={s.pipelineRow}>
                <span className={s.pipelineName}>{item.name}</span>
                <div className={s.pipelineBar}>
                  <div
                    className={s.pipelineFill}
                    style={{
                      width: data.total > 0 ? `${(item.value / data.total) * 100}%` : "0%",
                      background: statusColors[item.name] || "#90a4ae",
                    }}
                  />
                </div>
                <span className={s.pipelineCount}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seat matrix table */}
      <div className={ui.card}>
        <div className={ui.cardHeader}>
          <span className={ui.cardTitle}>📈 Seat Matrix Summary</span>
        </div>
        {data?.quotaStats?.length > 0 ? (
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Program</th>
                <th>Total Intake</th>
                <th>Quota</th>
                <th>Total</th>
                <th>Allocated</th>
                <th>Remaining</th>
                <th>Fill %</th>
              </tr>
            </thead>
            <tbody>
              {data.quotaStats.flatMap(prog =>
                prog.quotas.map((q, i) => (
                  <tr key={`${prog.programCode}-${q.quota}`}>
                    {i === 0 && (
                      <td rowSpan={prog.quotas.length} style={{ fontWeight: 700 }}>
                        {prog.program} <br />
                        <small style={{ color: "var(--text-muted)" }}>{prog.academicYear}</small>
                      </td>
                    )}
                    {i === 0 && <td rowSpan={prog.quotas.length}>{prog.totalIntake}</td>}
                    <td><span className={ui.badge + " " + ui.badgeBlue}>{q.quota}</span></td>
                    <td>{q.total}</td>
                    <td>{q.allocated}</td>
                    <td>
                      <span className={q.remaining === 0 ? `${ui.badge} ${ui.badgeRed}` : `${ui.badge} ${ui.badgeGreen}`}>
                        {q.remaining}
                      </span>
                    </td>
                    <td>
                      <div className={s.miniBar}>
                        <div
                          className={s.miniFill}
                          style={{ width: `${q.total > 0 ? (q.allocated / q.total) * 100 : 0}%` }}
                        />
                        <span>{q.total > 0 ? Math.round((q.allocated / q.total) * 100) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : <div className={ui.empty}>No seat matrix data yet</div>}
      </div>
    </div>
  );
}
