const express  = require('express');
const router   = express.Router();
const QRCode   = require('qrcode');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');
const Patient  = require('../models/Patient');

// ── Multer for patient photo ─────────────────────────────────
const photoDir = path.join(__dirname, '..', 'public', 'uploads', 'photos');
if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, photoDir),
    filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// GET /patient/register
router.get('/register', (req, res) => res.render('patient/register', { error: null }));

// POST /patient/register
router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const {
      name, phone, dateOfBirth, gender, bloodGroup, address,
      emergencyName, emergencyContact, emergencyRelation,
      allergies, chronicDiseases,
      // medicines – sent as arrays
      medicineName, medicineDosage, medicineDuration, medicineReason,
      // medical history – sent as arrays
      historyDate, historyHospital, historyDiagnosis, historyTreatment, historyDoctor
    } = req.body;

    const exists = await Patient.findOne({ phone });
    if (exists) return res.render('patient/register', { error: 'This phone number is already registered.' });

    // Build medicines array
    const medicines = [];
    if (medicineName) {
      const names = Array.isArray(medicineName) ? medicineName : [medicineName];
      names.forEach((n, i) => {
        if (n.trim()) {
          medicines.push({
            name:     n,
            dosage:   Array.isArray(medicineDosage)   ? medicineDosage[i]   : medicineDosage   || '',
            duration: Array.isArray(medicineDuration) ? medicineDuration[i] : medicineDuration || '',
            reason:   Array.isArray(medicineReason)   ? medicineReason[i]   : medicineReason   || ''
          });
        }
      });
    }

    // Build medical history array
    const medicalHistory = [];
    if (historyDate) {
      const dates = Array.isArray(historyDate) ? historyDate : [historyDate];
      dates.forEach((d, i) => {
        if (d.trim()) {
          medicalHistory.push({
            date:      d,
            hospital:  Array.isArray(historyHospital)  ? historyHospital[i]  : historyHospital  || '',
            diagnosis: Array.isArray(historyDiagnosis) ? historyDiagnosis[i] : historyDiagnosis || '',
            treatment: Array.isArray(historyTreatment) ? historyTreatment[i] : historyTreatment || '',
            doctor:    Array.isArray(historyDoctor)    ? historyDoctor[i]    : historyDoctor    || ''
          });
        }
      });
    }

    const qrToken = uuidv4();

    const patient = new Patient({
      name, phone, dateOfBirth, gender, bloodGroup, address,
      emergencyName, emergencyContact, emergencyRelation,
      allergies, chronicDiseases,
      medicines, medicalHistory,
      photo: req.file ? '/uploads/photos/' + req.file.filename : '',
      qrToken
    });
    await patient.save();

    // QR points to public emergency page
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const qrUrl   = `${baseUrl}/patient/emergency/${qrToken}`;

    const qrDir = path.join(__dirname, '..', 'public', 'qrcodes');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    await QRCode.toFile(path.join(qrDir, patient._id + '.png'), qrUrl, { width: 300, margin: 2 });

    patient.qrCode = '/qrcodes/' + patient._id + '.png';
    await patient.save();

    res.render('patient/success', { patient });
  } catch (err) {
    console.error(err);
    res.render('patient/register', { error: 'Server error: ' + err.message });
  }
});

// ── PUBLIC Emergency page (QR scan by anyone) ────────────────
// Shows ONLY emergency contact name and phone
router.get('/emergency/:token', async (req, res) => {
  try {
    const patient = await Patient.findOne({ qrToken: req.params.token });
    if (!patient) return res.render('patient/emergency-notfound');
    res.render('patient/emergency-public', { patient });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

// ── Patient Dashboard ─────────────────────────────────────────
router.get('/dashboard/:phone', async (req, res) => {
  try {
    const patient = await Patient.findOne({ phone: req.params.phone });
    if (!patient) return res.redirect('/patient/register');
    res.render('patient/dashboard', { patient, error: null, success: null });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ── Patient uploads their own report ─────────────────────────
const reportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'uploads', 'reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const reportUpload = multer({ storage: reportStorage });

router.post('/upload-report/:phone', reportUpload.single('reportFile'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const patient = await Patient.findOne({ phone: req.params.phone });
    if (!patient) return res.redirect('/patient/register');
    patient.reports.push({
      title:       title || 'My Report',
      description: description || '',
      fileUrl:     req.file ? '/uploads/reports/' + req.file.filename : ''
    });
    await patient.save();
    res.render('patient/dashboard', { patient, error: null, success: 'Report uploaded successfully!' });
  } catch (err) {
    res.render('patient/dashboard', { patient: null, error: 'Upload failed: ' + err.message, success: null });
  }
});
