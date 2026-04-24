import 'dart:convert';

import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import 'flutter_backend.dart';

/// Builds and returns a [Router] that handles all `/users` endpoints.
///
/// Routes exposed:
///   `GET  /users`          – list all users (JSON array)
///   `GET  /users/<id>`     – single user by id
///   `PUT  /users/<id>`     – partial update (firstName, lastName, email, role, status)
Router buildUserRouter(UserRepository repo) {
  final router = Router();

  // ── GET /users ──────────────────────────────────────────────────────────────
  router.get('/users', (Request request) {
    final users = repo.listUsers();
    return _jsonResponse(users.map((u) => u.toJson()).toList());
  });

  // ── GET /users/<id> ─────────────────────────────────────────────────────────
  router.get('/users/<id>', (Request request, String id) {
    final userId = int.tryParse(id);
    if (userId == null) {
      return _errorResponse(400, 'Invalid id: must be an integer.');
    }

    final user = repo.getUserById(userId);
    if (user == null) {
      return _errorResponse(404, 'User $userId not found.');
    }

    return _jsonResponse(user.toJson());
  });

  // ── PUT /users/<id> ─────────────────────────────────────────────────────────
  router.put('/users/<id>', (Request request, String id) async {
    final userId = int.tryParse(id);
    if (userId == null) {
      return _errorResponse(400, 'Invalid id: must be an integer.');
    }

    // Parse body.
    final body = await request.readAsString();
    Map<String, dynamic> fields;
    try {
      final decoded = jsonDecode(body);
      if (decoded is! Map<String, dynamic>) {
        return _errorResponse(400, 'Request body must be a JSON object.');
      }
      fields = decoded;
    } on FormatException {
      return _errorResponse(400, 'Request body is not valid JSON.');
    }

    // Reject unknown / non-updatable keys (optional strict validation).
    const allowed = {'firstName', 'lastName', 'email', 'role', 'status'};
    final unknown = fields.keys.toSet().difference(allowed);
    if (unknown.isNotEmpty) {
      return _errorResponse(
        400,
        'Unknown field(s): ${unknown.join(', ')}. '
        'Allowed: ${allowed.join(', ')}.',
      );
    }

    // Validate that all provided values are non-null strings.
    for (final entry in fields.entries) {
      if (entry.value == null || entry.value is! String) {
        return _errorResponse(
          400,
          'Field "${entry.key}" must be a non-null string.',
        );
      }
    }

    // Check existence before update.
    if (repo.getUserById(userId) == null) {
      return _errorResponse(404, 'User $userId not found.');
    }

    final updated = repo.updateUser(userId, fields);
    // updateUser returns null only if the row disappeared between the two
    // calls (race condition); treat as 404.
    if (updated == null) {
      return _errorResponse(404, 'User $userId not found.');
    }

    return _jsonResponse(updated.toJson());
  });

  return router;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

Response _jsonResponse(Object data, {int statusCode = 200}) {
  return Response(
    statusCode,
    body: jsonEncode(data),
    headers: {'content-type': 'application/json'},
  );
}

Response _errorResponse(int statusCode, String message) {
  return Response(
    statusCode,
    body: jsonEncode({'error': message}),
    headers: {'content-type': 'application/json'},
  );
}
