import React, { useEffect, useState } from "react";
import API from "../api";
import ui from "../components/ui.module.css";
import s from "./Master.module.css";

// ============================================================
// Reusable Master CRUD component
// ============================================================
function MasterCRUD({ title, icon, apiPath, fields, renderRow, columns }) {
  const [items, setItems]     = useState([]);
  const [form, setForm]       = useState({});
  const [showForm, setShowForm] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    API.get(apiPath)
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await API.post(apiPath, form);
      setSuccess(`✅ ${title} created successfully`);
      setShowForm(false);
      setForm({});
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      await API.delete(`${apiPath}/${id}`);
      setSuccess("Deleted successfully");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
    }
  };

  return (
    <div>
      <div className={ui.cardHeader}>
        <h2 className={s.heading}>{icon} {title}</h2>
        <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => { setShowForm(v => !v); setError(""); setSuccess(""); }}>
          {showForm ? "Cancel" : `+ Add ${title}`}
        </button>
      </div>

      {error   && <div className={`${ui.alert} ${ui.alertError}`}>{error}</div>}
      {success && <div className={`${ui.alert} ${ui.alertSuccess}`}>{success}</div>}

      {showForm && (
        <div className={ui.card}>
          <div className={ui.cardHeader}><span className={ui.cardTitle}>Add {title}</span></div>
          <form onSubmit={handleSubmit}>
            <div className={ui.formGrid}>
              {fields.map(f => (
                <div key={f.key} className={ui.formGroup} style={f.full ? { gridColumn: "span 2" } : {}}>
                  <label className={ui.label}>{f.label}{f.required ? " *" : ""}</label>
                  {f.type === "select" ? (
                    <select className={ui.select} required={f.required} value={form[f.key] || ""}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                      <option value="">-- Select --</option>
                      {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      className={ui.input}
                      type={f.type || "text"}
                      required={f.required}
                      value={form[f.key] || ""}
                      placeholder={f.placeholder || ""}
                      onChange={e => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button className={`${ui.btn} ${ui.btnPrimary}`} type="submit">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className={ui.card}>
        {loading ? (
          <div className={ui.spinner}>Loading...</div>
        ) : items.length === 0 ? (
          <div className={ui.empty}>No {title.toLowerCase()}s found. Add one above.</div>
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                {columns.map(c => <th key={c}>{c}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  {renderRow(item)}
                  <td>
                    <button
                      className={`${ui.btn} ${ui.btnDanger} ${ui.btnSm}`}
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
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

// ============================================================
// Institution Page
// ============================================================
export function InstitutionPage() {
  return (
    <MasterCRUD
      title="Institution" icon="🏛️" apiPath="/institutions"
      columns={["Name", "Code", "City", "Address"]}
      fields={[
        { key: "name",    label: "Institution Name", required: true },
        { key: "code",    label: "Short Code (e.g. INST)", required: true, placeholder: "INST" },
        { key: "city",    label: "City" },
        { key: "address", label: "Address", full: true },
      ]}
      renderRow={item => (
        <>
          <td><strong>{item.name}</strong></td>
          <td><span className={`${ui.badge} ${ui.badgeBlue}`}>{item.code}</span></td>
          <td>{item.city || "—"}</td>
          <td>{item.address || "—"}</td>
        </>
      )}
    />
  );
}

// ============================================================
// Campus Page (dynamic: loads institutions)
// ============================================================
export function CampusPage() {
  const [institutions, setInstitutions] = useState([]);
  useEffect(() => { API.get("/institutions").then(r => setInstitutions(r.data)); }, []);

  return (
    <MasterCRUD
      title="Campus" icon="🏫" apiPath="/campuses"
      columns={["Campus Name", "Institution", "Location"]}
      fields={[
        { key: "name",        label: "Campus Name", required: true },
        { key: "institution", label: "Institution", required: true, type: "select",
          options: institutions.map(i => ({ value: i._id, label: `${i.name} (${i.code})` })) },
        { key: "location", label: "Location" },
      ]}
      renderRow={item => (
        <>
          <td><strong>{item.name}</strong></td>
          <td>{item.institution?.name || "—"}</td>
          <td>{item.location || "—"}</td>
        </>
      )}
    />
  );
}

// ============================================================
// Department Page
// ============================================================
export function DepartmentPage() {
  const [campuses, setCampuses] = useState([]);
  useEffect(() => { API.get("/campuses").then(r => setCampuses(r.data)); }, []);

  return (
    <MasterCRUD
      title="Department" icon="📚" apiPath="/departments"
      columns={["Department", "Code", "Campus"]}
      fields={[
        { key: "name",   label: "Department Name", required: true },
        { key: "code",   label: "Short Code (e.g. CSE)", required: true },
        { key: "campus", label: "Campus", required: true, type: "select",
          options: campuses.map(c => ({ value: c._id, label: c.name })) },
      ]}
      renderRow={item => (
        <>
          <td><strong>{item.name}</strong></td>
          <td><span className={`${ui.badge} ${ui.badgeBlue}`}>{item.code}</span></td>
          <td>{item.campus?.name || "—"}</td>
        </>
      )}
    />
  );
}

// ============================================================
// Program Page
// ============================================================
export function ProgramPage() {
  const [departments, setDepartments] = useState([]);
  useEffect(() => { API.get("/departments").then(r => setDepartments(r.data)); }, []);

  return (
    <MasterCRUD
      title="Program" icon="🎓" apiPath="/programs"
      columns={["Program Name", "Code", "Type", "Entry", "Intake", "Department"]}
      fields={[
        { key: "name",        label: "Program Name", required: true, placeholder: "B.E Computer Science" },
        { key: "code",        label: "Short Code", required: true, placeholder: "CSE" },
        { key: "courseType",  label: "Course Type", required: true, type: "select",
          options: [{ value: "UG", label: "UG" }, { value: "PG", label: "PG" }] },
        { key: "entryType",   label: "Entry Type", required: true, type: "select",
          options: [{ value: "Regular", label: "Regular" }, { value: "Lateral", label: "Lateral" }] },
        { key: "totalIntake", label: "Total Intake", required: true, type: "number", placeholder: "60" },
        { key: "department",  label: "Department", required: true, type: "select",
          options: departments.map(d => ({ value: d._id, label: `${d.name} — ${d.campus?.name || ""}` })) },
      ]}
      renderRow={item => (
        <>
          <td><strong>{item.name}</strong></td>
          <td><span className={`${ui.badge} ${ui.badgeBlue}`}>{item.code}</span></td>
          <td><span className={`${ui.badge} ${ui.badgePurple}`}>{item.courseType}</span></td>
          <td>{item.entryType}</td>
          <td><strong>{item.totalIntake}</strong></td>
          <td>{item.department?.name || "—"}</td>
        </>
      )}
    />
  );
}

// ============================================================
// Academic Year Page
// ============================================================
export function AcademicYearPage() {
  return (
    <MasterCRUD
      title="Academic Year" icon="📅" apiPath="/academic-years"
      columns={["Label", "Start Year", "Active"]}
      fields={[
        { key: "label",     label: "Label (e.g. 2026-27)", required: true, placeholder: "2026-27" },
        { key: "startYear", label: "Start Year", required: true, type: "number", placeholder: "2026" },
      ]}
      renderRow={item => (
        <>
          <td><strong>{item.label}</strong></td>
          <td>{item.startYear}</td>
          <td><span className={`${ui.badge} ${item.active ? ui.badgeGreen : ui.badgeGray}`}>{item.active ? "Active" : "Inactive"}</span></td>
        </>
      )}
    />
  );
}
