import { Table, TableCell, TableRow } from "@invoice-platform/ui"
import { PageHeader } from "@invoice-platform/ui"
import { AccountingButton } from "../../components/AccountingButton"
import { AccountingStatusBadge } from "../../components/AccountingStatusBadge"

const accounts = [
  {
    number: "1000",
    name: "Kasse",
    type: "Aktiv"
  },
  {
    number: "1200",
    name: "Bank",
    type: "Aktiv"
  },
  {
    number: "8400",
    name: "Umsatzerlöse",
    type: "Ertrag"
  }
]

export default function AccountsPage() {
  return (
    <main className="p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Kontenplan"
            description="Verwaltung aller Sachkonten"
          />

          <AccountingButton>Neues Konto</AccountingButton>
        </div>

        <Table headers={["Kontonummer", "Name", "Typ"]}>
          {accounts.map((account) => (
            <TableRow key={account.number}>
              <TableCell>{account.number}</TableCell>
              <TableCell>{account.name}</TableCell>
              <TableCell><AccountingStatusBadge status={account.type} /></TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    </main>
  )
}
