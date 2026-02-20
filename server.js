require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public', 'uploads'));
    },
    filename: function (req, file, cb) {
        // Save as hero-bg with original extension to prevent cache issues, we append timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'hero-bg-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Not an image!'));
    }
});

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // process.env.NODE_ENV === 'production', - disabled for cloudflare without simple https proxy setup internally
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Auth Middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// ========================
// PUBLIC API ENDPOINTS
// ========================

app.get('/api/menu', (req, res) => {
    try {
        const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
        const items = db.prepare('SELECT * FROM menu_items ORDER BY category_id, sort_order').all();
        const notesObj = db.prepare("SELECT value FROM settings WHERE key = 'menu_notes'").get();
        const heroObj = db.prepare("SELECT value FROM settings WHERE key = 'hero_image'").get();
        const titleObj = db.prepare("SELECT value FROM settings WHERE key = 'menu_title'").get();
        const subObj = db.prepare("SELECT value FROM settings WHERE key = 'menu_subtitle'").get();

        // Group items by category
        const menu = categories.map(category => ({
            ...category,
            items: items.filter(item => item.category_id === category.id)
        }));

        res.json({
            categories: menu,
            notes: notesObj ? notesObj.value : '',
            heroImage: heroObj ? heroObj.value : '',
            title: titleObj ? titleObj.value : 'Il Nostro Menu',
            subtitle: subObj ? subObj.value : 'Sapori autentici, preparati con passione ogni giorno.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ========================
// ADMIN API ENDPOINTS
// ========================

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
    res.json({ isAuthenticated: !!req.session.isAdmin });
});

// Categories CRUD
app.post('/api/categories', requireAdmin, (req, res) => {
    const { name, sort_order } = req.body;
    try {
        const info = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(name, sort_order || 0);
        res.json({ id: info.lastInsertRowid, name, sort_order });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/categories/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, sort_order } = req.body;
    try {
        db.prepare('UPDATE categories SET name = ?, sort_order = ? WHERE id = ?').run(name, sort_order, id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Menu Items CRUD
app.post('/api/items', requireAdmin, (req, res) => {
    const { category_id, name, description, price, sort_order } = req.body;
    try {
        const info = db.prepare('INSERT INTO menu_items (category_id, name, description, price, sort_order) VALUES (?, ?, ?, ?, ?)')
            .run(category_id, name, description, price, sort_order || 0);
        res.json({ id: info.lastInsertRowid, category_id, name, description, price, sort_order });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/items/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { category_id, name, description, price, sort_order } = req.body;
    try {
        db.prepare('UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, sort_order = ? WHERE id = ?')
            .run(category_id, name, description, price, sort_order, id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/items/:id', requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Settings CRUD
app.post('/api/settings', requireAdmin, (req, res) => {
    const settingsUpdates = req.body;
    try {
        const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?');
        const updateSettings = db.transaction((updates) => {
            for (const [k, v] of Object.entries(updates)) {
                stmt.run(k, v, v);
            }
        });
        updateSettings(settingsUpdates);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Image Upload
app.post('/api/upload-hero', requireAdmin, upload.single('heroImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nessun file caricato' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
            .run('hero_image', imageUrl, imageUrl);

        res.json({ success: true, imageUrl });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Diner Menu Server running on port ${PORT}`);
});
