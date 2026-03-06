const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  title:       { type: String, default: 'Medical Report' },
  description: { type: String, default: '' },
  reportImage: { type: String, default: '' },
  date:        { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalRecord', recordSchema);
