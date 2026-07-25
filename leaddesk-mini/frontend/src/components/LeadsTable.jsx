const STATUS_LABELS = {
  New: { className: "status-new" },
  Contacted: { className: "status-contacted" },
  Closed: { className: "status-closed" },
};

const BUDGET_LABELS = {
  under_1k: "Under $1k",
  "1k_5k": "$1k-$5k",
  "5k_15k": "$5k-$15k",
  "15k_50k": "$15k-$50k",
  "50k_plus": "$50k+",
};

const STATUS_ORDER = ["New", "Contacted", "Closed"];

function nextStatus(current) {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

export default function LeadsTable({ leads, onStatusChange, updatingId }) {
  if (leads.length === 0) {
    return (
      <div className="empty-state">
        <p>No leads match this view yet.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="leads-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Budget</th>
            <th>Message</th>
            <th>Received</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.name}</td>
              <td className="mono">{lead.email}</td>
              <td>{BUDGET_LABELS[lead.budgetRange] || lead.budgetRange}</td>
              <td className="message-cell" title={lead.message}>
                {lead.message}
              </td>
              <td className="mono">{new Date(lead.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  type="button"
                  className={`status-pill ${STATUS_LABELS[lead.status].className}`}
                  onClick={() => onStatusChange(lead.id, nextStatus(lead.status))}
                  disabled={updatingId === lead.id}
                  title="Click to advance status"
                >
                  {updatingId === lead.id ? "Updating…" : lead.status}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
