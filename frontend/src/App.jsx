import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const statuses = ["open", "in_progress", "resolved", "closed"];
const statusLabels = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityOptions = ["low", "medium", "high", "urgent"];

const formatAge = (minutes) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ priority: "", breached: false });

  const [formValues, setFormValues] = useState({
    subject: "",
    description: "",
    customerEmail: "",
    priority: "medium",
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (filters.priority) {
        params.priority = filters.priority;
      }
      if (filters.breached) {
        params.breached = "true";
      }

      const { data } = await axios.get(`${API_BASE}/tickets`, { params });
      setTickets(data);
    } catch (requestError) {
      setError("Unable to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/tickets/stats`);
      setStats(data);
    } catch (requestError) {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  const groupedTickets = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status] = tickets.filter((ticket) => ticket.status === status);
      return acc;
    }, {});
  }, [tickets]);

  const handleFilterChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formValues.subject.trim()) {
      nextErrors.subject = "Subject is required.";
    }
    if (!formValues.description.trim()) {
      nextErrors.description = "Description is required.";
    }
    if (!formValues.customerEmail.trim()) {
      nextErrors.customerEmail = "Email is required.";
    } else if (!emailRegex.test(formValues.customerEmail)) {
      nextErrors.customerEmail = "Enter a valid email.";
    }
    if (!priorityOptions.includes(formValues.priority)) {
      nextErrors.priority = "Select a valid priority.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        subject: formValues.subject.trim(),
        description: formValues.description.trim(),
        customerEmail: formValues.customerEmail.trim(),
        priority: formValues.priority,
      };

      await axios.post(`${API_BASE}/tickets`, payload);
      setFormValues({
        subject: "",
        description: "",
        customerEmail: "",
        priority: "medium",
      });
      setFormErrors({});
      await fetchTickets();
      await fetchStats();
    } catch (requestError) {
      setError("Unable to create ticket. Please check the form fields.");
    }
  };

  const handleMove = async (ticketId, nextStatus) => {
    try {
      await axios.patch(`${API_BASE}/tickets/${ticketId}`, {
        status: nextStatus,
      });
      await fetchTickets();
      await fetchStats();
    } catch (requestError) {
      setError("Unable to update ticket status.");
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">DeskFlow</p>
          <h1>Support ticket triage, flowing at speed.</h1>
          <p>
            Track priority, SLA, and status transitions with a focused board for
            your support team.
          </p>
        </div>
        <div className="hero-panel">
          <div>
            <p className="panel-label">Live Stats</p>
            <p className="panel-value">
              {stats ? stats.totalTickets : "--"} Tickets
            </p>
          </div>
          <div>
            <p className="panel-label">Breached (Open)</p>
            <p className="panel-value">{stats ? stats.breachedOpen : "--"}</p>
          </div>
        </div>
      </header>

      <section className="stats-strip">
        {statuses.map((status) => (
          <div key={status} className="stat-card">
            <p className="stat-label">{statusLabels[status]}</p>
            <p className="stat-value">
              {stats?.statusCounts ? stats.statusCounts[status] : "--"}
            </p>
          </div>
        ))}
        <div className="stat-card accent">
          <p className="stat-label">Breached Open</p>
          <p className="stat-value">{stats ? stats.breachedOpen : "--"}</p>
        </div>
      </section>

      <section className="filters">
        <div className="filter-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            name="breached"
            checked={filters.breached}
            onChange={handleFilterChange}
          />
          <span>Only SLA breached</span>
        </label>
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setFilters({ priority: "", breached: false });
          }}
        >
          Reset Filters
        </button>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="board">
        {statuses.map((status) => (
          <div key={status} className="column">
            <div className="column-header">
              <h2>{statusLabels[status]}</h2>
              <span>{groupedTickets[status]?.length ?? 0}</span>
            </div>
            <div className="column-body">
              {loading ? (
                <div className="loading">Loading tickets...</div>
              ) : groupedTickets[status]?.length ? (
                groupedTickets[status].map((ticket) => {
                  const currentIndex = statuses.indexOf(ticket.status);
                  const prevStatus =
                    currentIndex > 0 ? statuses[currentIndex - 1] : null;
                  const nextStatus =
                    currentIndex < statuses.length - 1
                      ? statuses[currentIndex + 1]
                      : null;

                  return (
                    <article
                      key={ticket._id}
                      className={`ticket priority-${ticket.priority}`}
                    >
                      <header>
                        <h3>{ticket.subject}</h3>
                        <span className="badge">{ticket.priority}</span>
                      </header>
                      <p className="ticket-desc">{ticket.description}</p>
                      <div className="ticket-meta">
                        <span>{formatAge(ticket.ageMinutes)}</span>
                        {ticket.slaBreached ? (
                          <span className="breach">SLA Breached</span>
                        ) : (
                          <span className="ok">On Track</span>
                        )}
                      </div>
                      <div className="actions">
                        {prevStatus ? (
                          <button
                            type="button"
                            onClick={() => handleMove(ticket._id, prevStatus)}
                          >
                            {statusLabels[prevStatus]}
                          </button>
                        ) : null}
                        {nextStatus ? (
                          <button
                            type="button"
                            onClick={() => handleMove(ticket._id, nextStatus)}
                          >
                            {statusLabels[nextStatus]}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty">No tickets</div>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="form-section">
        <div>
          <h2>Create Ticket</h2>
          <p>
            Log a new request with priority and customer details. New tickets
            land in the Open column instantly.
          </p>
        </div>
        <form className="ticket-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              name="subject"
              value={formValues.subject}
              onChange={handleFormChange}
              placeholder="Cannot log in"
            />
            {formErrors.subject ? (
              <span className="field-error">{formErrors.subject}</span>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="customerEmail">Customer Email</label>
            <input
              id="customerEmail"
              name="customerEmail"
              value={formValues.customerEmail}
              onChange={handleFormChange}
              placeholder="customer@deskflow.io"
              type="email"
            />
            {formErrors.customerEmail ? (
              <span className="field-error">{formErrors.customerEmail}</span>
            ) : null}
          </div>
          <div className="field full">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleFormChange}
              placeholder="Describe the issue..."
              rows={4}
            />
            {formErrors.description ? (
              <span className="field-error">{formErrors.description}</span>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formValues.priority}
              onChange={handleFormChange}
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {formErrors.priority ? (
              <span className="field-error">{formErrors.priority}</span>
            ) : null}
          </div>
          <button type="submit" className="primary-button">
            Create Ticket
          </button>
        </form>
      </section>
    </div>
  );
}

export default App;
