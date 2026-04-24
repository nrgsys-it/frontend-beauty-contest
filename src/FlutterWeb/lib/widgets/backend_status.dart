import 'package:flutter/material.dart';
import 'package:flutter_web/services/backend_service.dart';

class BackendStatus extends StatefulWidget {
  const BackendStatus({super.key});

  @override
  State<BackendStatus> createState() => _BackendStatusState();
}

class _BackendStatusState extends State<BackendStatus> {
  bool? isConnected;

  @override
  void initState() {
    super.initState();
    _checkBackendStatus();
  }

  Future<void> _checkBackendStatus() async {
    final status = await BackendService().checkConnection();
    if (!mounted) return;

    setState(() {
      isConnected = status;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isConnected == null) {
      return const Text(
        'Verifica connessione al backend...',
        style: TextStyle(color: Colors.grey),
      );
    }
    
    return Text(isConnected! ? 'Connesso' : 'Disconnesso',
      style: TextStyle(
        color: isConnected! ? Colors.white : Colors.red,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}
