const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Basic Info
  name:             { type: String, required: true },
  phone:            { type: String, required: true, unique: true },
  dateOfBirth:      { type: String, default: '' },
  gender:           { type: String, default: '' },
  bloodGroup:       { type: String, default: '' },
  address:          { type: String, default: '' },

  // Photo
  photo:            { type: String, default: '' },

  // Emergency Contact
  emergencyName:    { type: String, required: true },
  emergencyContact: { type: String, required: true },
  emergencyRelation:{ type: String, default: '' },

  // Medical Info
  allergies:        { type: String, default: '' },
  chronicDiseases:  { type: String, default: '' },

  // Medicines taken in last 1 year (array of objects)
  medicines: [{
    name:      { type: String },
    dosage:    { type: String },
    duration:  { type: String },
    reason:    { type: String }
  }],

  // Medical History (array of objects)
  medicalHistory: [{
    date:      { type: String },
    hospital:  { type: String },
    diagnosis: { type: String },
    treatment: { type: String },
    doctor:    { type: String }
  }],

  // QR Code
  qrCode:  { type: String, default: '' },
  qrToken: { type: String, default: '' },

  // Patient's own uploaded reports
  reports: [{
    title:       { type: String },
    description: { type: String },
    fileUrl:     { type: String },
    uploadedAt:  { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
