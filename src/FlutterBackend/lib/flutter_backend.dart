/// Data layer for flutter_backend.
///
/// Usage:
/// ```dart
/// import 'package:flutter_backend/flutter_backend.dart';
///
/// final db   = openDatabase();
/// final repo = UserRepository(db);
/// ```
library;

export 'database.dart' show openDatabase;
export 'user_repository.dart' show User, UserRepository;
export 'user_routes.dart' show buildUserRouter;
