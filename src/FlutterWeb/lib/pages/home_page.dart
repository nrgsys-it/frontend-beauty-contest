import 'package:flutter/material.dart';
import 'package:flutter_web/widgets/backend_status.dart';
import 'package:flutter_web/widgets/counter_button.dart';
import 'package:flutter_web/widgets/users_table.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter Web Spike'),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: Center(child: BackendStatus()),
          ),
        ],
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: const Padding(
          padding: EdgeInsets.all(24), 
          child: Column(crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CounterButton(),
            SizedBox(height: 24),
            UsersTable(),
          ],)),
    );
  }
}
