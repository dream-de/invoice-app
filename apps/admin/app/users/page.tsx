import { designTokens, PageHeader, StatusBadge, Table, TableCell, TableRow } from "@dream-invoice/ui"
import { AdminContentCard } from "../../components/AdminContentCard"

const users = [
  {
    id: 1,
    name: "Erika Beispiel",
    role: "Administrator",
    status: "Aktiv"
  },
  {
    id: 2,
    name: "Anna Schmidt",
    role: "Accounting",
    status: "Aktiv"
  },
  {
    id: 3,
    name: "Demo User",
    role: "Viewer",
    status: "Inaktiv"
  }
]

export default function UsersPage() {
  return (
    <main className={designTokens.utility.ua4d0f420b7}>
      <div className={designTokens.utility.u9cb760d000}>
        <PageHeader
          title="Benutzerverwaltung"
          description="Alle Benutzer und Rollen verwalten"
        />

        <AdminContentCard title="Benutzer">
          <Table
            headers={[
              "ID",
              "Name",
              "Rolle",
              "Status"
            ]}
          >
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell><StatusBadge status={user.status} /></TableCell>
              </TableRow>
            ))}
          </Table>
        </AdminContentCard>
      </div>
    </main>
  )
}
