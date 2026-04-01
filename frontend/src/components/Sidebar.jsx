import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "./Sidebar.module.css";

const links = {
  all: [
    { to: "/dashboard", icon: "📊", label: "Dashboard" },
  ],
  officerAdmin: [
    { to: "/applicants",   icon: "👥", label: "Applicants" },
    { to: "/seat-matrix",  icon: "🪑", label: "Seat Matrix" },
  ],
  admin: [
    { to: "/master/institution", icon: "🏛️", label: "Institution" },
    { to: "/master/campus",      icon: "🏫", label: "Campus" },
    { to: "/master/department",  icon: "📚", label: "Department" },
    { to: "/master/program",     icon: "🎓", label: "Programs" },
    { to: "/master/academic-year",icon: "📅", label: "Academic Year" },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();

  const getClass = ({ isActive }) =>
    `${s.link}${isActive ? " " + s.active : ""}`;

  return (
    <aside className={s.sidebar}>
      <div className={s.section}>Overview</div>
      {links.all.map(l => (
        <NavLink key={l.to} to={l.to} className={getClass}>
          <span className={s.icon}>{l.icon}</span> {l.label}
        </NavLink>
      ))}

      {(user?.role === "officer" || user?.role === "admin") && (
        <>
          <div className={s.section}>Admissions</div>
          {links.officerAdmin.map(l => (
            <NavLink key={l.to} to={l.to} className={getClass}>
              <span className={s.icon}>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </>
      )}

      {user?.role === "admin" && (
        <>
          <div className={s.section}>Master Setup</div>
          {links.admin.map(l => (
            <NavLink key={l.to} to={l.to} className={getClass}>
              <span className={s.icon}>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </>
      )}
    </aside>
  );
}
