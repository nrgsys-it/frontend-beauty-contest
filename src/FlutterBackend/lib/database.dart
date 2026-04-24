import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:sqlite3/sqlite3.dart';

/// Opens (or creates) the SQLite database at `data/flutter_backend.sqlite`
/// relative to the project root, creates the schema if needed, and seeds
/// example rows when the `users` table is empty.
Database openDatabase() {
  // Resolve path relative to the script / CWD so it works both locally and
  // inside Docker (where the working directory is the project root).
  final dbDir = Directory(p.join(Directory.current.path, 'data'));
  if (!dbDir.existsSync()) {
    dbDir.createSync(recursive: true);
  }

  final dbPath = p.join(dbDir.path, 'flutter_backend.sqlite');
  final db = sqlite3.open(dbPath);

  // Enable WAL for better concurrent read performance.
  db.execute('PRAGMA journal_mode=WAL;');
  db.execute('PRAGMA foreign_keys=ON;');

  _createSchema(db);
  _seedIfEmpty(db);

  return db;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

void _createSchema(Database db) {
  db.execute('''
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT    NOT NULL,
      lastName  TEXT    NOT NULL,
      email     TEXT    NOT NULL UNIQUE,
      role      TEXT    NOT NULL DEFAULT 'viewer',
      status    TEXT    NOT NULL DEFAULT 'active'
    );
  ''');
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const _seedUsers = [
  {
    'firstName': 'Alice',
    'lastName': 'Nguyen',
    'email': 'alice.nguyen@example.com',
    'role': 'admin',
    'status': 'active',
  },
  {
    'firstName': 'Bob',
    'lastName': 'Müller',
    'email': 'bob.mueller@example.com',
    'role': 'editor',
    'status': 'active',
  },
  {
    'firstName': 'Carol',
    'lastName': 'Smith',
    'email': 'carol.smith@example.com',
    'role': 'viewer',
    'status': 'active',
  },
  {
    'firstName': 'David',
    'lastName': 'Park',
    'email': 'david.park@example.com',
    'role': 'editor',
    'status': 'inactive',
  },
  {
    'firstName': 'Eva',
    'lastName': 'Rossi',
    'email': 'eva.rossi@example.com',
    'role': 'viewer',
    'status': 'pending',
  },
];

void _seedIfEmpty(Database db) {
  final count =
      db.select('SELECT COUNT(*) AS c FROM users').first['c'] as int;
  if (count > 0) return;

  final stmt = db.prepare('''
    INSERT INTO users (firstName, lastName, email, role, status)
    VALUES (?, ?, ?, ?, ?)
  ''');

  for (final u in _seedUsers) {
    stmt.execute([
      u['firstName'],
      u['lastName'],
      u['email'],
      u['role'],
      u['status'],
    ]);
  }

  stmt.dispose();
}
