import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/user.dart';

class BackendService {
  static const String baseUrl = 'http://localhost:8080';

  Future<bool> checkConnection() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/health'))
          .timeout(const Duration(seconds: 3));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<List<User>> getUsers() async {
    final response = await http.get(Uri.parse('$baseUrl/users'));
    
    if (response.statusCode != 200) {
      throw Exception('Errore durante il caricamento degli utenti');
    }

    final List<dynamic> jsonList = jsonDecode(response.body);
    return jsonList
        .map((json) => User.fromJson(json))
        .toList();
  }
}
