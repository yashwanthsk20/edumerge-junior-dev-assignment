/**
 * ============================================================
 * Edumerge - Admission Management & CRM
 * Single File Backend: server.js
 * Stack: Node.js + Express + MongoDB (Mongoose)
 * ============================================================
 */

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://s28666560_db_user:OQJgBnnFOjeAWg4X@cluster0.dq066xi.mongodb.net/edumerge";
const JWT_SECRET = process.env.JWT_SECRET || "edumerge_secret";

// ============================================================
// DATABASE CONNECTION
// ============================================================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected via Compass");
    seedDefaultUsers();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ============================================================
// SCHEMAS & MODELS
// ============================================================

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["admin", "officer", "management"], default: "officer" },
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

const institutionSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  code:    { type: String, required: true, unique: true },
  city:    { type: String },
  address: { type: String },
}, { timestamps: true });
const Institution = mongoose.model("Institution", institutionSchema);

const campusSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true },
  name:        { type: String, required: true },
  location:    { type: String },
}, { timestamps: true });
const Campus = mongoose.model("Campus", campusSchema);

const departmentSchema = new mongoose.Schema({
  campus: { type: mongoose.Schema.Types.ObjectId, ref: "Campus", required: true },
  name:   { type: String, required: true },
  code:   { type: String, required: true },
}, { timestamps: true });
const Department = mongoose.model("Department", departmentSchema);

const academicYearSchema = new mongoose.Schema({
  label:     { type: String, required: true },
  startYear: { type: Number, required: true },
  active:    { type: Boolean, default: true },
}, { timestamps: true });
const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);

const programSchema = new mongoose.Schema({
  department:  { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  name:        { type: String, required: true },
  code:        { type: String, required: true },
  courseType:  { type: String, enum: ["UG", "PG"], required: true },
  entryType:   { type: String, enum: ["Regular", "Lateral"], required: true },
  totalIntake: { type: Number, required: true },
}, { timestamps: true });
const Program = mongoose.model("Program", programSchema);

const seatMatrixSchema = new mongoose.Schema({
  program:      { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  quotas: [{
    quota:     { type: String, enum: ["KCET", "COMEDK", "Management"], required: true },
    total:     { type: Number, required: true },
    allocated: { type: Number, default: 0 },
  }],
  supernumerary: { type: Number, default: 0 },
}, { timestamps: true });
const SeatMatrix = mongoose.model("SeatMatrix", seatMatrixSchema);

const applicantSchema = new mongoose.Schema({
  firstName:       { type: String, required: true },
  lastName:        { type: String, required: true },
  email:           { type: String, required: true },
  phone:           { type: String, required: true },
  dob:             { type: Date },
  gender:          { type: String, enum: ["Male", "Female", "Other"] },
  category:        { type: String, enum: ["GM", "SC", "ST", "OBC", "EWS"], required: true },
  entryType:       { type: String, enum: ["Regular", "Lateral"], required: true },
  quota:           { type: String, enum: ["KCET", "COMEDK", "Management"], required: true },
  program:         { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  academicYear:    { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  allotmentNumber: { type: String },
  marksObtained:   { type: Number },
  maxMarks:        { type: Number },
  admissionMode:   { type: String, enum: ["Government", "Management"], required: true },
  documents: {
    tenthMarksheet:   { type: String, enum: ["Pending", "Submitted", "Verified"], default: "Pending" },
    twelfthMarksheet: { type: String, enum: ["Pending", "Submitted", "Verified"], default: "Pending" },
    transferCert:     { type: String, enum: ["Pending", "Submitted", "Verified"], default: "Pending" },
    casteCert:        { type: String, enum: ["Pending", "Submitted", "Verified"], default: "Pending" },
    photo:            { type: String, enum: ["Pending", "Submitted", "Verified"], default: "Pending" },
  },
  status: {
    type: String,
    enum: ["Applied", "SeatAllocated", "DocumentsVerified", "FeePaid", "Admitted", "Cancelled"],
    default: "Applied",
  },
  feeStatus:       { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  admissionNumber: { type: String, unique: true, sparse: true },
  seatLocked:      { type: Boolean, default: false },
}, { timestamps: true });
const Applicant = mongoose.model("Applicant", applicantSchema);

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
};

const notManagement = (req, res, next) => {
  if (req.user.role === "management") return res.status(403).json({ error: "View-only access" });
  next();
};

// ============================================================
// SEED DEFAULT USERS
// ============================================================
async function seedDefaultUsers() {
  const count = await User.countDocuments();
  if (count === 0) {
    const hash = (pw) => bcrypt.hashSync(pw, 10);
    await User.insertMany([
      { name: "Admin User",       email: "admin@inst.edu",    password: hash("admin123"),   role: "admin" },
      { name: "Admission Officer",email: "officer@inst.edu",  password: hash("officer123"), role: "officer" },
      { name: "Management View",  email: "mgmt@inst.edu",     password: hash("mgmt123"),    role: "management" },
    ]);
    console.log("✅ Default users seeded (admin / officer / management)");
  }
}

// ============================================================
// AUTH ROUTES
// ============================================================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/auth/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// ============================================================
// MASTER SETUP ROUTES
// ============================================================

// Institutions
app.get("/api/institutions", protect, async (_, res) => {
  res.json(await Institution.find());
});
app.post("/api/institutions", protect, adminOnly, async (req, res) => {
  try { res.status(201).json(await Institution.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.put("/api/institutions/:id", protect, adminOnly, async (req, res) => {
  try { res.json(await Institution.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete("/api/institutions/:id", protect, adminOnly, async (req, res) => {
  await Institution.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Campuses
app.get("/api/campuses", protect, async (_, res) => {
  res.json(await Campus.find().populate("institution", "name code"));
});
app.post("/api/campuses", protect, adminOnly, async (req, res) => {
  try { res.status(201).json(await Campus.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete("/api/campuses/:id", protect, adminOnly, async (req, res) => {
  await Campus.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Departments
app.get("/api/departments", protect, async (_, res) => {
  res.json(await Department.find().populate("campus", "name"));
});
app.post("/api/departments", protect, adminOnly, async (req, res) => {
  try { res.status(201).json(await Department.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete("/api/departments/:id", protect, adminOnly, async (req, res) => {
  await Department.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Academic Years
app.get("/api/academic-years", protect, async (_, res) => {
  res.json(await AcademicYear.find().sort("-startYear"));
});
app.post("/api/academic-years", protect, adminOnly, async (req, res) => {
  try { res.status(201).json(await AcademicYear.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// Programs
app.get("/api/programs", protect, async (_, res) => {
  res.json(await Program.find().populate({ path: "department", populate: { path: "campus" } }));
});
app.post("/api/programs", protect, adminOnly, async (req, res) => {
  try { res.status(201).json(await Program.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.put("/api/programs/:id", protect, adminOnly, async (req, res) => {
  try { res.json(await Program.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete("/api/programs/:id", protect, adminOnly, async (req, res) => {
  await Program.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ============================================================
// SEAT MATRIX ROUTES
// ============================================================
app.get("/api/seat-matrix", protect, async (_, res) => {
  res.json(await SeatMatrix.find()
    .populate("program", "name code totalIntake")
    .populate("academicYear", "label"));
});

app.get("/api/seat-matrix/program/:programId/year/:ayId", protect, async (req, res) => {
  const sm = await SeatMatrix.findOne({ program: req.params.programId, academicYear: req.params.ayId })
    .populate("program", "name code totalIntake")
    .populate("academicYear", "label");
  res.json(sm || null);
});

app.post("/api/seat-matrix", protect, adminOnly, async (req, res) => {
  try {
    const { program, academicYear, quotas, supernumerary } = req.body;
    const prog = await Program.findById(program);
    if (!prog) return res.status(404).json({ error: "Program not found" });

    const quotaSum = quotas.reduce((s, q) => s + Number(q.total), 0);
    if (quotaSum !== prog.totalIntake)
      return res.status(400).json({ error: `Quota total (${quotaSum}) must equal program intake (${prog.totalIntake})` });

    const existing = await SeatMatrix.findOne({ program, academicYear });
    if (existing) {
      existing.quotas = quotas;
      existing.supernumerary = supernumerary || 0;
      await existing.save();
      return res.json(existing);
    }
    res.status(201).json(await SeatMatrix.create({ program, academicYear, quotas, supernumerary: supernumerary || 0 }));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================================
// APPLICANT ROUTES
// ============================================================
app.get("/api/applicants", protect, async (req, res) => {
  const { status, quota, program } = req.query;
  const filter = {};
  if (status)  filter.status = status;
  if (quota)   filter.quota = quota;
  if (program) filter.program = program;
  res.json(await Applicant.find(filter)
    .populate("program", "name code courseType")
    .populate("academicYear", "label")
    .sort("-createdAt"));
});

app.get("/api/applicants/:id", protect, async (req, res) => {
  const a = await Applicant.findById(req.params.id)
    .populate("program", "name code courseType totalIntake")
    .populate("academicYear", "label");
  if (!a) return res.status(404).json({ error: "Applicant not found" });
  res.json(a);
});

app.post("/api/applicants", protect, notManagement, async (req, res) => {
  try { res.status(201).json(await Applicant.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.put("/api/applicants/:id", protect, notManagement, async (req, res) => {
  try { res.json(await Applicant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================================
// SEAT ALLOCATION
// ============================================================
app.post("/api/applicants/:id/allocate-seat", protect, notManagement, async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ error: "Applicant not found" });
    if (applicant.seatLocked) return res.status(400).json({ error: "Seat already allocated" });

    const sm = await SeatMatrix.findOne({ program: applicant.program, academicYear: applicant.academicYear });
    if (!sm) return res.status(400).json({ error: "Seat matrix not configured for this program/year" });

    const quotaRow = sm.quotas.find(q => q.quota === applicant.quota);
    if (!quotaRow) return res.status(400).json({ error: `Quota ${applicant.quota} not configured` });

    const remaining = quotaRow.total - quotaRow.allocated;
    if (remaining <= 0)
      return res.status(400).json({ error: `❌ Quota FULL — No seats available in ${applicant.quota}` });

    quotaRow.allocated += 1;
    await sm.save();

    applicant.seatLocked = true;
    applicant.status = "SeatAllocated";
    await applicant.save();

    res.json({ message: "✅ Seat allocated successfully", remaining: remaining - 1, applicant });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// DOCUMENT STATUS UPDATE
// ============================================================
app.patch("/api/applicants/:id/documents", protect, notManagement, async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ error: "Applicant not found" });

    Object.assign(applicant.documents, req.body);
    const allVerified = Object.values(applicant.documents).every(v => v === "Verified");
    if (allVerified && applicant.status === "SeatAllocated") applicant.status = "DocumentsVerified";
    await applicant.save();
    res.json(applicant);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================================
// FEE STATUS
// ============================================================
app.patch("/api/applicants/:id/fee", protect, notManagement, async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ error: "Applicant not found" });
    if (!applicant.seatLocked) return res.status(400).json({ error: "Seat must be allocated before fee payment" });

    applicant.feeStatus = "Paid";
    if (["SeatAllocated", "DocumentsVerified"].includes(applicant.status)) applicant.status = "FeePaid";
    await applicant.save();
    res.json(applicant);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// ADMISSION CONFIRMATION
// ============================================================
app.post("/api/applicants/:id/confirm-admission", protect, notManagement, async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id)
      .populate("program", "code courseType department")
      .populate("academicYear", "startYear");

    if (!applicant)           return res.status(404).json({ error: "Applicant not found" });
    if (applicant.admissionNumber) return res.status(400).json({ error: "Admission already confirmed" });
    if (!applicant.seatLocked)     return res.status(400).json({ error: "Seat must be allocated first" });
    if (applicant.feeStatus !== "Paid") return res.status(400).json({ error: "Fee must be paid before confirmation" });

    // Get institution code
    const program  = await Program.findById(applicant.program._id);
    const dept     = await Department.findById(program.department);
    const campus   = await Campus.findById(dept.campus);
    const inst     = await Institution.findById(campus.institution);

    const count  = await Applicant.countDocuments({ admissionNumber: { $exists: true, $ne: null } });
    const seq    = String(count + 1).padStart(4, "0");
    const year   = applicant.academicYear?.startYear || new Date().getFullYear();
    const admissionNumber = `${inst.code}/${year}/${applicant.program.courseType}/${applicant.program.code}/${applicant.quota}/${seq}`;

    applicant.admissionNumber = admissionNumber;
    applicant.status = "Admitted";
    await applicant.save();

    res.json({ message: "🎉 Admission confirmed!", admissionNumber, applicant });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// DASHBOARD
// ============================================================
app.get("/api/dashboard", protect, async (_, res) => {
  try {
    const [total, admitted, feePending, seatMatrices, applicants] = await Promise.all([
      Applicant.countDocuments(),
      Applicant.countDocuments({ status: "Admitted" }),
      Applicant.countDocuments({ feeStatus: "Pending", seatLocked: true }),
      SeatMatrix.find().populate("program", "name code totalIntake").populate("academicYear", "label"),
      Applicant.find({ status: { $ne: "Cancelled" } }),
    ]);

    const docPending = applicants.filter(a =>
      ["SeatAllocated", "DocumentsVerified"].includes(a.status) &&
      Object.values(a.documents).some(v => v !== "Verified")
    ).length;

    const quotaStats = seatMatrices.map(sm => ({
      program:      sm.program?.name,
      programCode:  sm.program?.code,
      academicYear: sm.academicYear?.label,
      totalIntake:  sm.program?.totalIntake,
      quotas: sm.quotas.map(q => ({
        quota:     q.quota,
        total:     q.total,
        allocated: q.allocated,
        remaining: q.total - q.allocated,
      })),
    }));

    const statusBreakdown = { Applied: 0, SeatAllocated: 0, DocumentsVerified: 0, FeePaid: 0, Admitted: 0 };
    applicants.forEach(a => { if (statusBreakdown[a.status] !== undefined) statusBreakdown[a.status]++; });

    res.json({ total, admitted, feePending, docPending, quotaStats, statusBreakdown });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// USER MANAGEMENT (admin only)
// ============================================================
app.get("/api/users", protect, adminOnly, async (_, res) => {
  res.json(await User.find().select("-password"));
});
app.post("/api/users", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    const safe = user.toObject(); delete safe.password;
    res.status(201).json(safe);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
  console.log(`📋 Default logins:`);
  console.log(`   Admin:   admin@inst.edu   / admin123`);
  console.log(`   Officer: officer@inst.edu / officer123`);
  console.log(`   Mgmt:    mgmt@inst.edu    / mgmt123`);
});
