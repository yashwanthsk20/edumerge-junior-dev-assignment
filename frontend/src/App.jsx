import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import Applicants     from "./pages/Applicants";
import ApplicantForm  from "./pages/ApplicantForm";
import ApplicantDetail from "./pages/ApplicantDetail";
import SeatMatrix     from "./pages/SeatMatrix";
import {
  InstitutionPage,
  CampusPage,
  DepartmentPage,
  ProgramPage,
  AcademicYearPage,
} from "./pages/Master";

import "./styles/global.css";

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/applicants" element={
          <ProtectedRoute roles={["admin","officer","management"]}>
            <Layout><Applicants /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/applicants/new" element={
          <ProtectedRoute roles={["admin","officer"]}>
            <Layout><ApplicantForm /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/applicants/:id" element={
          <ProtectedRoute roles={["admin","officer","management"]}>
            <Layout><ApplicantDetail /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/seat-matrix" element={
          <ProtectedRoute roles={["admin","officer"]}>
            <Layout><SeatMatrix /></Layout>
          </ProtectedRoute>
        } />

        {/* Admin master setup */}
        <Route path="/master/institution" element={
          <ProtectedRoute roles={["admin"]}>
            <Layout><InstitutionPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/master/campus" element={
          <ProtectedRoute roles={["admin"]}>
            <Layout><CampusPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/master/department" element={
          <ProtectedRoute roles={["admin"]}>
            <Layout><DepartmentPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/master/program" element={
          <ProtectedRoute roles={["admin"]}>
            <Layout><ProgramPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/master/academic-year" element={
          <ProtectedRoute roles={["admin"]}>
            <Layout><AcademicYearPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
