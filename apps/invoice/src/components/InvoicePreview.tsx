type InvoicePosition = {
  title: string;
  quantity: number;
  unitPrice: number;
};

type InvoiceData = {
  number: string;
  date: string;
  vatRate: number;
  vatAmount: any;
  subTotal: any;
  total: any;
  tip: number;
  positions: InvoicePosition[];
};

type CustomerData = {
  name?: string | null;
  email?: string | null;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  country?: string | null;
};

type CompanyData = {
  company: string;
  street: string;
  zip: string;
  city: string;
  country: string;
};

export default function InvoicePreview({
  invoice,
  customer,
  company
}: {
  invoice: InvoiceData;
  customer: CustomerData | null;
  company: CompanyData;
}) {
  return (
    <div className="p-10 bg-white shadow-md rounded-md text-black">
      <h1 className="text-2xl font-bold mb-4">Rechnung #{invoice.number}</h1>

      <div className="mb-6">
        <p><strong>Datum:</strong> {invoice.date}</p>
        <p><strong>Netto:</strong> {invoice.subTotal} €</p>
        <p><strong>MwSt:</strong> {invoice.vatAmount} €</p>
        <p><strong>Brutto:</strong> {invoice.total} €</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Positionen</h2>
      <ul className="space-y-2">
        {invoice.positions.map((p, i) => (
          <li key={i} className="border-b pb-2">
            <strong>{p.title}</strong> — {p.quantity} × {p.unitPrice} €
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Kunde</h2>
      {customer ? (
        <div>
          <p>{customer.name}</p>
          <p>{customer.street}</p>
          <p>{customer.zip} {customer.city}</p>
          <p>{customer.country}</p>
        </div>
      ) : (
        <p className="text-gray-500">Kein Kunde zugeordnet</p>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">Firma</h2>
      <div>
        <p>{company.company}</p>
        <p>{company.street}</p>
        <p>{company.zip} {company.city}</p>
        <p>{company.country}</p>
      </div>
    </div>
  );
}
