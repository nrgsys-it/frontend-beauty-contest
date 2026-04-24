import 'package:flutter/material.dart';
import 'package:flutter_web/models/user.dart';
import 'package:flutter_web/services/backend_service.dart';

class UsersTable extends StatefulWidget {
  const UsersTable({super.key});

  @override
  State<UsersTable> createState() => _UsersTableState();
}

class _UsersTableState extends State<UsersTable> {
  late Future<List<User>> usersFuture;

  @override
  void initState() {
    super.initState();
    usersFuture = BackendService().getUsers();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<User>>(
      future: usersFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final users = snapshot.data ?? [];
        if (users.isEmpty) {
          return const Text('Nessun utente trovato');
        }

        const headerTextStyle = TextStyle(fontWeight: FontWeight.bold, color: Colors.white);
        
        return LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: ConstrainedBox(
                constraints: BoxConstraints(minWidth: constraints.maxWidth),
                child: DataTable(
                  headingRowColor: WidgetStateProperty.all(const Color(0xFF4CAF50)),
                  columns: const [
                    DataColumn(label: Text('ID', style: headerTextStyle)),
                    DataColumn(label: Text('Nome', style: headerTextStyle)),
                    DataColumn(label: Text('Cognome', style: headerTextStyle)),
                    DataColumn(label: Text('Email', style: headerTextStyle)),
                    DataColumn(label: Text('Ruolo', style: headerTextStyle)),
                    DataColumn(label: Text('Stato', style: headerTextStyle)),
                  ],
                  rows: users.map((user) {
                    return DataRow(
                      cells: [
                        DataCell(Text(user.id.toString())),
                        DataCell(Text(user.firstName)),
                        DataCell(Text(user.lastName)),
                        DataCell(Text(user.email)),
                        DataCell(Text(user.role)),
                        DataCell(Text(user.status)),
                      ],
                     );
                  }).toList(),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
