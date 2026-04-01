import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import s from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <nav className={s.navbar}>
      <div className={s.brand}>
        🎓 Edumerge CRM <span>Admission Management</span>
      </div>
      {user && (
        <div className={s.right}>
          <span className={s.userInfo}>👤 {user.name}</span>
          <span className={s.role}>{user.role}</span>
          <button className={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
}
