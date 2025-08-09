Program Tiketing dengan Node.js
Berikut adalah program sederhana untuk sistem tiket menggunakan Node.js dengan Express.js sebagai framework:

Struktur Proyek
text
ticket-system/
├── config/
│   └── db.js
├── controllers/
│   ├── ticketController.js
│   └── userController.js
├── models/
│   ├── Ticket.js
│   └── User.js
├── routes/
│   ├── ticketRoutes.js
│   └── userRoutes.js
├── app.js
├── package.json
└── README.md
1. Inisialisasi Proyek
Buat folder proyek dan jalankan:

bash
npm init -y
npm install express mongoose body-parser cors
2. Konfigurasi Dasar (app.js)
javascript
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const db = require('./config/db');
mongoose.connect(db.url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
3. Konfigurasi Database (config/db.js)
javascript
module.exports = {
  url: 'mongodb://localhost:27017/ticket_system'
};
4. Model Tiket (models/Ticket.js)
javascript
const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ticket', TicketSchema);
5. Model User (models/User.js)
javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'agent'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
6. Controller Tiket (controllers/ticketController.js)
javascript
const Ticket = require('../models/Ticket');

// Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const ticket = new Ticket({
      title,
      description,
      priority,
      createdBy: req.user.id
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('createdBy assignedTo');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy assignedTo');
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update ticket
exports.updateTicket = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status, assignedTo, priority, updatedAt: Date.now() },
      { new: true }
    ).populate('createdBy assignedTo');
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
7. Routes Tiket (routes/ticketRoutes.js)
javascript
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

router.post('/', ticketController.createTicket);
router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
8. Middleware Autentikasi (middleware/auth.js)
javascript
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
9. Menjalankan Aplikasi
Tambahkan script berikut ke package.json:

json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js"
}
Jalankan aplikasi dengan:

bash
npm run dev
Fitur yang Tersedia:
Membuat tiket baru

Melihat daftar tiket

Melihat detail tiket

Memperbarui tiket (status, prioritas, penugasan)

Menghapus tiket

Autentikasi pengguna

Catatan:
Program ini menggunakan MongoDB sebagai database

Anda perlu menginstal MongoDB dan menjalankannya secara lokal

Untuk autentikasi yang lebih lengkap, Anda bisa menambahkan fitur registrasi dan login

Untuk produksi, tambahkan validasi, error handling, dan security yang lebih ketat

Anda dapat mengembangkan program ini lebih lanjut dengan menambahkan fitur seperti:

Upload lampiran

Komentar pada tiket

Notifikasi email

Dashboard statistik

Pencarian dan filter tiket
