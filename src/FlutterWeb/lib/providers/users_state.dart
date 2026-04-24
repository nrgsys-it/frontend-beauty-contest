import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/backend_service.dart';

class UsersState extends ChangeNotifier {
  UsersState({BackendService? service})
    : _service = service ?? BackendService();

  final BackendService _service;

  List<User> _users = <User>[];
  bool _isLoading = false;
  String? _errorMessage;
  int? _sortColumnIndex;
  bool _sortAscending = true;

  List<User> get users => List.unmodifiable(_users);

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int? get sortColumnIndex => _sortColumnIndex;
  bool get sortAscending => _sortAscending;

  Future<void> loadUsers() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _users = await _service.getUsers();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<User> updateUser(User user) async {
    final updated = await _service.updateUser(user);
    final index = _users.indexWhere((u) => u.id == updated.id);
    if (index != -1) {
      _users[index] = updated;
    }
    notifyListeners();
    return updated;
  }
  
  void sortUsers<T>(
    Comparable<T> Function(User user) getField,
    int columnIndex,
    bool ascending,
  ) {
    _sortColumnIndex = columnIndex;
    _sortAscending = ascending;
    _users.sort((a, b) {
      final aValue = getField(a);
      final bValue = getField(b);
      return ascending
          ? Comparable.compare(aValue, bValue)
          : Comparable.compare(bValue, aValue);
    });
    notifyListeners();
  }
}
