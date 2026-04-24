import 'package:flutter/material.dart';
import 'package:flutter_web/widgets/counter_button.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter Web Spike'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: const Center(child: CounterButton()),
    );
  }
}
