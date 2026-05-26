import { designTokens, PageHeader, Table, TableCell, TableRow } from "@dream-invoice/ui"
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
    <main className={designTokens.utility.ua4d0f420b7}>
      <div className={designTokens.utility.uadc5ca2753}>
        <div className={designTokens.utility.u9c7f2a2b70}>
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
