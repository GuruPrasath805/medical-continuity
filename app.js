require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// ── Connect MongoDB ─────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => { console.error('❌ MongoDB Error:', err); process.exit(1); });

// ── View Engine ─────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ───────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ── Routes ───────────────────────────────────────────────────
app.use('/',        require('./routes/index'));
app.use('/patient', require('./routes/patient'));
app.use('/doctor',  require('./routes/doctor'));
app.use('/admin',   require('./routes/admin'));

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).send('<h2>404 - Page Not Found</h2><a href="/">Home</a>'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  Server → http://localhost:${PORT}`);
  console.log(`🔐  Admin  → http://localhost:${PORT}/admin/login  (admin / admin123)\n`);
});
