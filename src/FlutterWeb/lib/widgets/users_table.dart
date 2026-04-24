import 'package:flutter/material.dart';
import 'package:flutter_web/models/user.dart';
import 'package:flutter_web/pages/user_detail_page.dart';
import 'package:flutter_web/services/backend_service.dart';

class UsersTable extends StatefulWidget {
  const UsersTable({super.key});

  @override
  State<UsersTable> createState() => _UsersTableState();
}

class _UsersTableState extends State<UsersTable> {
  late Future<List<User>> usersFuture;

  int? sortColumnIndex;
  bool sortAscending = true;

  @override
  void initState() {
    super.initState();
    usersFuture = BackendService().getUsers();
  }

  void sortUsers<T>(
    List<User> users,
    Comparable<T> Function(User user) getField,
    int columnIndex,
    bool ascending,
  ) {
    users.sort((a, b) {
      final aValue = getField(a);
      final bValue = getField(b);
      return ascending
          ? Comparable.compare(aValue, bValue)
          : Comparable.compare(bValue, aValue);
    });
    setState(() {
      sortColumnIndex = columnIndex;
      sortAscending = ascending;
    });
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

        const headerTextStyle = TextStyle(
          fontWeight: FontWeight.bold,
          color: Colors.white,
        );

        return LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: ConstrainedBox(
                constraints: BoxConstraints(minWidth: constraints.maxWidth),
                child: Theme(
                  data: Theme.of(context).copyWith(
                    iconTheme: const IconThemeData(color: Colors.white),
                  ),
                  child: DataTable(
                    headingRowColor: WidgetStateProperty.all(
                      const Color(0xFF4CAF50),
                    ),
                    sortColumnIndex: sortColumnIndex,
                    sortAscending: sortAscending,
                    columns: [
                      DataColumn(
                        label: const Text('ID', style: headerTextStyle),
                        onSort: (int columnIndex, bool ascending) {
                          sortUsers(
                            users,
                            (user) => user.id,
                            columnIndex,
                            ascending,
                          );
                        },
                      ),
                      DataColumn(
                        label: const Text('Nome', style: headerTextStyle),
                        onSort: (int columnIndex, bool ascending) {
                          sortUsers(
                            users,
                            (user) => user.firstName,
                            columnIndex,
                            ascending,
                          );
                        },
                      ),
                      DataColumn(
                        label: Text('Cognome', style: headerTextStyle),
                        onSort: (int columnIndex, bool ascending) {
                          sortUsers(
                            users,
                            (user) => user.lastName,
                            columnIndex,
                            ascending,
                          );
                        },
                      ),
                      DataColumn(
                        label: Text('Email', style: headerTextStyle),
                        onSort: (int columnIndex, bool ascending) {
                          sortUsers(
                            users,
                            (user) => user.email,
                            columnIndex,
                            ascending,
                          );
                        },
                      ),
                      DataColumn(
                        label: Text('Ruolo', style: headerTextStyle),
                        onSort: (int columnIndex, bool ascending) {
                          sortUsers(
                            users,
                            (user) => user.role,
                            columnIndex,
                            ascending,
                          );
                        },
                      ),
                      DataColumn(
                        label: Text('Stato', style: headerTextStyle),
                        onSort: (int columnIndex, bool ascending) {
                          sortUsers(
                            users,
                            (user) => user.status,
                            columnIndex,
                            ascending,
                          );
                        },
                      ),
                      const DataColumn(
                        label: Text('Azioni', style: headerTextStyle),
                      ),
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
                          DataCell(
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF4CAF50),
                                foregroundColor: Colors.white,
                              ),
                              onPressed: () async {
                                await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => UserDetailPage(user: user),
                                  ),
                                );
                                if (!mounted) return;
                                setState(() {
                                  usersFuture = BackendService().getUsers();
                                });
                              },
                              child: const Text('Visualizza'),
                            ),
                          ),
                        ],
                      );
                    }).toList(),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
