const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'menu.db');
const db = new sqlite3(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Example seed data, only inserted if categories is empty
const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (categoryCount.count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
  const infoMain = insertCategory.run('Piatti Principali', 1);
  const infoDrinks = insertCategory.run('Bevande', 2);

  const insertItem = db.prepare('INSERT INTO menu_items (category_id, name, description, price, sort_order) VALUES (?, ?, ?, ?, ?)');

  insertItem.run(infoMain.lastInsertRowid, 'Hamburger Classico', 'Hamburger di manzo con formaggio, lattuga e pomodoro', 12.50, 1);
  insertItem.run(infoMain.lastInsertRowid, 'Club Sandwich', 'Tacchino, pancetta, lattuga, pomodoro e maionese su pane tostato', 10.00, 2);

  insertItem.run(infoDrinks.lastInsertRowid, 'Frullato', 'Frullato alla vaniglia o cioccolato con panna montata', 5.50, 1);
  insertItem.run(infoDrinks.lastInsertRowid, 'Tè Freddo', 'Tè nero appena preparato servito con ghiaccio', 3.00, 2);

  // Seed initial notes
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('menu_notes', 'Note: Servizio e coperto esclusi.');
}

module.exports = db;
