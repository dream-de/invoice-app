import { designTokens, PageHeader, Table, TableCell, TableRow } from "@dream-invoice/ui"
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
    <main className={designTokens.utility.ua4d0f420b7}>
      <div className={designTokens.utility.uadc5ca2753}>
        <div className={designTokens.utility.u9c7f2a2b70}>
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
