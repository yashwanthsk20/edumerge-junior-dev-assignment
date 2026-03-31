import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import s from "./Login.module.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "management" ? "/dashboard" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    const creds = {
      admin:      { email: "admin@inst.edu",   password: "admin123" },
      officer:    { email: "officer@inst.edu", password: "officer123" },
      management: { email: "mgmt@inst.edu",    password: "mgmt123" },
    };
    setForm(creds[role]);
  };

  return (
    <div className={s.page}>
      <div className={s.box}>
        <div className={s.logo}>🎓</div>
        <h1 className={s.title}>Edumerge CRM</h1>
        <p className={s.subtitle}>Admission Management System</p>

        {error && <div className={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input
              className={s.input}
              type="email" required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your email"
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input
              className={s.input}
              type="password" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
            />
          </div>
          <button className={s.submitBtn} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={s.demoSection}>
          <p className={s.demoLabel}>Quick Demo Login</p>
          <div className={s.demoButtons}>
            <button className={s.demoBtn} onClick={() => fillDemo("admin")}>Admin</button>
            <button className={s.demoBtn} onClick={() => fillDemo("officer")}>Officer</button>
            <button className={s.demoBtn} onClick={() => fillDemo("management")}>Management</button>
          </div>
        </div>
      </div>
    </div>
  );
}
