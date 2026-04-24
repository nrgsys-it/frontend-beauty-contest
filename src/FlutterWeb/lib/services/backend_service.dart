import 'package:http/http.dart' as http;

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
}
