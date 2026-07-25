import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import LeadsTable from "../components/LeadsTable.jsx";
import Footer from "../components/Footer.jsx";
import "./AdminDashboard.css";

const STATUS_FILTERS = ["All", "New", "Contacted", "Closed"];

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "All") params.status = statusFilter;
      const data = await api.listLeads(params);
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    // Debounce the search box so we're not firing a request on every keystroke.
    const timeout = setTimeout(loadLeads, 300);
    return () => clearTimeout(timeout);
  }, [loadLeads]);

  async function handleStatusChange(id, nextStatus) {
    setUpdatingId(id);
    try {
      const updated = await api.updateStatus(id, nextStatus);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: updated.status } : l)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    await api.logout().catch(() => {});
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin-page">
      <header className="admin-nav">
        <span className="wordmark">LeadDesk</span>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <main className="admin-main">
        <div className="admin-header-row">
          <div>
            <h1>Leads</h1>
            <p className="admin-subtitle">{total} total</p>
          </div>
        </div>

        <div className="admin-controls">
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <div className="status-filters">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                className={`filter-chip ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        {loading ? (
          <p className="admin-loading">Loading leads…</p>
        ) : (
          <LeadsTable leads={leads} onStatusChange={handleStatusChange} updatingId={updatingId} />
        )}
      </main>

      <Footer />
    </div>
  );
}
