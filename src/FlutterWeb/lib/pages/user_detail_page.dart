import 'package:flutter/material.dart';
import 'package:flutter_web/models/user.dart';
import 'package:flutter_web/services/backend_service.dart';

class UserDetailPage extends StatefulWidget {
  final User user;

  const UserDetailPage({super.key, required this.user});

  @override
  State<UserDetailPage> createState() => _UserDetailPageState();
}

class _UserDetailPageState extends State<UserDetailPage> {
  late User _user;
  bool _isEditing = false;
  bool _isSaving = false;

  late final TextEditingController _firstNameController;
  late final TextEditingController _lastNameController;
  late final TextEditingController _emailController;
  late final TextEditingController _roleController;
  late final TextEditingController _statusController;

  @override
  void initState() {
    super.initState();
    _user = widget.user;
    _firstNameController = TextEditingController(text: _user.firstName);
    _lastNameController = TextEditingController(text: _user.lastName);
    _emailController = TextEditingController(text: _user.email);
    _roleController = TextEditingController(text: _user.role);
    _statusController = TextEditingController(text: _user.status);
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _roleController.dispose();
    _statusController.dispose();
    super.dispose();
  }

  void _enterEditMode() {
    _firstNameController.text = _user.firstName;
    _lastNameController.text = _user.lastName;
    _emailController.text = _user.email;
    _roleController.text = _user.role;
    _statusController.text = _user.status;
    setState(() {
      _isEditing = true;
    });
  }

  Future<void> _save() async {
    setState(() {
      _isSaving = true;
    });

    final updated = _user.copyWith(
      firstName: _firstNameController.text,
      lastName: _lastNameController.text,
      email: _emailController.text,
      role: _roleController.text,
      status: _statusController.text,
    );

    try {
      final result = await BackendService().updateUser(updated);
      if (!mounted) return;
      setState(() {
        _user = result;
        _isEditing = false;
        _isSaving = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Utente aggiornato con successo'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSaving = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore durante il salvataggio: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final buttonStyle = ElevatedButton.styleFrom(
      backgroundColor: Colors.green,
      foregroundColor: Colors.white,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text('${_user.firstName} ${_user.lastName}'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _DetailRow(label: 'ID', value: _user.id.toString()),
            if (!_isEditing) ...[
              _DetailRow(label: 'First Name', value: _user.firstName),
              _DetailRow(label: 'Last Name', value: _user.lastName),
              _DetailRow(label: 'Email', value: _user.email),
              _DetailRow(label: 'Role', value: _user.role),
              _DetailRow(label: 'Status', value: _user.status),
              const SizedBox(height: 24),
              ElevatedButton(
                style: buttonStyle,
                onPressed: _enterEditMode,
                child: const Text('Modifica'),
              ),
            ] else ...[
              _EditRow(label: 'First Name', controller: _firstNameController),
              _EditRow(label: 'Last Name', controller: _lastNameController),
              _EditRow(label: 'Email', controller: _emailController),
              _EditRow(label: 'Role', controller: _roleController),
              _EditRow(label: 'Status', controller: _statusController),
              const SizedBox(height: 24),
              ElevatedButton(
                style: buttonStyle,
                onPressed: _isSaving ? null : _save,
                child: _isSaving
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Salva'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

class _EditRow extends StatelessWidget {
  final String label;
  final TextEditingController controller;

  const _EditRow({required this.label, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: TextField(
              controller: controller,
              decoration: const InputDecoration(
                isDense: true,
                border: OutlineInputBorder(),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: Colors.green, width: 2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
