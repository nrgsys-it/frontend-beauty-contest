import 'package:flutter/material.dart';
import 'package:flutter_web/pages/home_page.dart';
import 'package:flutter_web/providers/users_state.dart';
import 'package:provider/provider.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<UsersState>(
      create: (_) => UsersState()..loadUsers(),
      child: MaterialApp(
        title: 'Flutter Web BC',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        ),
        home: const HomePage(),
      ),
    );
  }
}
