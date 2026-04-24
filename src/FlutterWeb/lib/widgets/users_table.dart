import 'package:flutter/material.dart';
import 'package:flutter_web/pages/user_detail_page.dart';
import 'package:flutter_web/providers/users_state.dart';
import 'package:provider/provider.dart';

class UsersTable extends StatelessWidget {
  const UsersTable({super.key});

  @override
  Widget build(BuildContext context) {
    final usersState = context.watch<UsersState>();

    if (usersState.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (usersState.errorMessage != null) {
      return Text(
        usersState.errorMessage!,
        style: const TextStyle(color: Colors.red),
      );
    }

    final users = usersState.users;
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
              data: Theme.of(
                context,
              ).copyWith(iconTheme: const IconThemeData(color: Colors.white)),
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(
                  const Color(0xFF4CAF50),
                ),
                sortColumnIndex: usersState.sortColumnIndex,
                sortAscending: usersState.sortAscending,
                columns: [
                  DataColumn(
                    label: const Text('ID', style: headerTextStyle),
                    onSort: (int columnIndex, bool ascending) {
                      usersState.sortUsers(
                        (user) => user.id,
                        columnIndex,
                        ascending,
                      );
                    },
                  ),
                  DataColumn(
                    label: const Text('Nome', style: headerTextStyle),
                    onSort: (int columnIndex, bool ascending) {
                      usersState.sortUsers(
                        (user) => user.firstName,
                        columnIndex,
                        ascending,
                      );
                    },
                  ),
                  DataColumn(
                    label: Text('Cognome', style: headerTextStyle),
                    onSort: (int columnIndex, bool ascending) {
                      usersState.sortUsers(
                        (user) => user.lastName,
                        columnIndex,
                        ascending,
                      );
                    },
                  ),
                  DataColumn(
                    label: Text('Email', style: headerTextStyle),
                    onSort: (int columnIndex, bool ascending) {
                      usersState.sortUsers(
                        (user) => user.email,
                        columnIndex,
                        ascending,
                      );
                    },
                  ),
                  DataColumn(
                    label: Text('Ruolo', style: headerTextStyle),
                    onSort: (int columnIndex, bool ascending) {
                      usersState.sortUsers(
                        (user) => user.role,
                        columnIndex,
                        ascending,
                      );
                    },
                  ),
                  DataColumn(
                    label: Text('Stato', style: headerTextStyle),
                    onSort: (int columnIndex, bool ascending) {
                      usersState.sortUsers(
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
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => UserDetailPage(user: user),
                              ),
                            );
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
  }
}
