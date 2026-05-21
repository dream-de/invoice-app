import { Table, TableCell, TableRow } from "@dream-invoice/ui"
import { PageHeader } from "@dream-invoice/ui"
import { AccountingButton } from "../../components/AccountingButton"
import { AccountingStatusBadge } from "../../components/AccountingStatusBadge"

const entries = [
  {
    id: "entry_1",
    date: "2026-05-10",
    description: "Demo Buchung",
    debit: 119,
    credit: 119,
    status: "Ausgeglichen"
  }
]

export default function JournalPage() {
  return (
    <main className="p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Journal"
            description="Buchungen und Journaleinträge"
          />

          <AccountingButton>Neue Buchung</AccountingButton>
        </div>

        <Table headers={["Datum", "Beschreibung", "Soll", "Haben", "Status"]}>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.date}</TableCell>
              <TableCell>{entry.description}</TableCell>
              <TableCell>{entry.debit.toFixed(2)} €</TableCell>
              <TableCell>{entry.credit.toFixed(2)} €</TableCell>
              <TableCell><AccountingStatusBadge status={entry.status} /></TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    </main>
  )
}
