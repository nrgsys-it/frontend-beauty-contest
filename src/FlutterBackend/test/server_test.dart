import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart';
import 'package:test/test.dart';

void main() {
  final port = '8181'; // use a different port to avoid conflicts
  final host = 'http://127.0.0.1:$port';
  late Process p;

  setUp(() async {
    p = await Process.start(
      'dart',
      ['run', 'bin/server.dart'],
      environment: {'PORT': port},
    );
    // Wait for server to start and print to stdout.
    await p.stdout.first;
  });

  tearDown(() => p.kill());

  // ── Legacy routes ──────────────────────────────────────────────────────────

  test('Root returns Hello World', () async {
    final response = await get(Uri.parse('$host/'));
    expect(response.statusCode, 200);
    expect(response.body, 'Hello, World!\n');
  });

  test('Unknown route returns 404', () async {
    final response = await get(Uri.parse('$host/foobar'));
    expect(response.statusCode, 404);
  });

  // ── Health ─────────────────────────────────────────────────────────────────

  test('GET /health returns 200 with status ok', () async {
    final response = await get(Uri.parse('$host/health'));
    expect(response.statusCode, 200);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    expect(body['status'], 'ok');
  });

  // ── GET /users ─────────────────────────────────────────────────────────────

  test('GET /users returns a JSON array', () async {
    final response = await get(Uri.parse('$host/users'));
    expect(response.statusCode, 200);
    final body = jsonDecode(response.body);
    expect(body, isA<List>());
    expect((body as List).isNotEmpty, isTrue);
    // Each item should have the expected keys.
    final first = body.first as Map<String, dynamic>;
    expect(first.keys, containsAll(['id', 'firstName', 'lastName', 'email', 'role', 'status']));
  });

  // ── GET /users/<id> ────────────────────────────────────────────────────────

  test('GET /users/1 returns a single user', () async {
    final response = await get(Uri.parse('$host/users/1'));
    expect(response.statusCode, 200);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    expect(body['id'], 1);
  });

  test('GET /users/999 returns 404', () async {
    final response = await get(Uri.parse('$host/users/999'));
    expect(response.statusCode, 404);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    expect(body.containsKey('error'), isTrue);
  });

  test('GET /users/abc returns 400 for invalid id', () async {
    final response = await get(Uri.parse('$host/users/abc'));
    expect(response.statusCode, 400);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    expect(body.containsKey('error'), isTrue);
  });

  // ── PUT /users/<id> ────────────────────────────────────────────────────────

  test('PUT /users/1 updates firstName and returns updated user', () async {
    final response = await put(
      Uri.parse('$host/users/1'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'firstName': 'AliceUpdated'}),
    );
    expect(response.statusCode, 200);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    expect(body['id'], 1);
    expect(body['firstName'], 'AliceUpdated');
  });

  test('PUT /users/999 returns 404', () async {
    final response = await put(
      Uri.parse('$host/users/999'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'firstName': 'Ghost'}),
    );
    expect(response.statusCode, 404);
  });

  test('PUT /users/abc returns 400 for invalid id', () async {
    final response = await put(
      Uri.parse('$host/users/abc'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'firstName': 'X'}),
    );
    expect(response.statusCode, 400);
  });

  test('PUT /users/1 with unknown field returns 400', () async {
    final response = await put(
      Uri.parse('$host/users/1'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'password': 'secret'}),
    );
    expect(response.statusCode, 400);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    expect(body['error'], contains('password'));
  });

  test('PUT /users/1 with invalid JSON returns 400', () async {
    final response = await put(
      Uri.parse('$host/users/1'),
      headers: {'content-type': 'application/json'},
      body: 'not-json',
    );
    expect(response.statusCode, 400);
  });

  // ── CORS headers ───────────────────────────────────────────────────────────

  test('Responses include CORS header when Origin is sent', () async {
    final response = await get(
      Uri.parse('$host/users'),
      headers: {'Origin': 'http://localhost:5000'},
    );
    expect(
      response.headers['access-control-allow-origin'],
      isNotNull,
    );
  });
}
