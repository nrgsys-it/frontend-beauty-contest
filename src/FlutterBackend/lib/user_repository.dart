import 'package:sqlite3/sqlite3.dart';

/// Represents a user row from the `users` table.
class User {
  final int id;
  final String firstName;
  final String lastName;
  final String email;
  final String role;
  final String status;

  const User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
    required this.status,
  });

  factory User.fromRow(Row row) => User(
        id: row['id'] as int,
        firstName: row['firstName'] as String,
        lastName: row['lastName'] as String,
        email: row['email'] as String,
        role: row['role'] as String,
        status: row['status'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'role': role,
        'status': status,
      };
}

/// Data-access object for the `users` table.
class UserRepository {
  final Database _db;

  UserRepository(this._db);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /// Returns all users ordered by [lastName], [firstName].
  List<User> listUsers() {
    final rows = _db.select(
      'SELECT * FROM users ORDER BY lastName, firstName',
    );
    return rows.map(User.fromRow).toList();
  }

  /// Returns the user with [id], or `null` if not found.
  User? getUserById(int id) {
    final rows = _db.select(
      'SELECT * FROM users WHERE id = ?',
      [id],
    );
    if (rows.isEmpty) return null;
    return User.fromRow(rows.first);
  }

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  /// Updates the mutable fields of an existing user.
  ///
  /// Only non-null values in [fields] are applied.
  /// Allowed keys: `firstName`, `lastName`, `email`, `role`, `status`.
  ///
  /// Returns the updated [User], or `null` if no row with [id] exists.
  User? updateUser(int id, Map<String, dynamic> fields) {
    const allowed = {'firstName', 'lastName', 'email', 'role', 'status'};
    final updates = {
      for (final e in fields.entries)
        if (allowed.contains(e.key) && e.value != null) e.key: e.value,
    };

    if (updates.isEmpty) return getUserById(id);

    final setClauses = updates.keys.map((k) => '$k = ?').join(', ');
    final values = [...updates.values, id];

    _db.execute(
      'UPDATE users SET $setClauses WHERE id = ?',
      values,
    );

    return getUserById(id);
  }
}
