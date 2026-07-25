import { useState } from "react";
import { api } from "../api.js";

const BUDGET_OPTIONS = [
  { value: "under_1k", label: "Under $1,000" },
  { value: "1k_5k", label: "$1,000 - $5,000" },
  { value: "5k_15k", label: "$5,000 - $15,000" },
  { value: "15k_50k", label: "$15,000 - $50,000" },
  { value: "50k_plus", label: "$50,000+" },
];

const EMPTY = { name: "", email: "", budgetRange: "", message: "" };

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Enter a valid email address.";
  if (!values.budgetRange) errors.budgetRange = "Select a budget range.";
  if (values.message.trim().length < 10) errors.message = "Tell us a bit more - at least 10 characters.";
  return errors;
}

export default function LeadForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitState, setSubmitState] = useState("idle"); // idle | sending | success | error
  const [serverError, setServerError] = useState("");

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate({ ...values }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched({ name: true, email: true, budgetRange: true, message: true });

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitState("sending");
    setServerError("");
    try {
      await api.submitLead(values);
      setSubmitState("success");
      setValues(EMPTY);
      setTouched({});
    } catch (err) {
      setSubmitState("error");
      setServerError(err.message);
    }
  }

  if (submitState === "success") {
    return (
      <div className="lead-form-success" role="status">
        <h3>Message sent</h3>
        <p>Thanks - someone from the team will follow up shortly.</p>
        <button type="button" className="btn btn-secondary" onClick={() => setSubmitState("idle")}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          aria-invalid={Boolean(touched.name && errors.name)}
          aria-describedby="name-error"
        />
        {touched.name && errors.name && (
          <p className="field-error" id="name-error">{errors.name}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          aria-invalid={Boolean(touched.email && errors.email)}
          aria-describedby="email-error"
        />
        {touched.email && errors.email && (
          <p className="field-error" id="email-error">{errors.email}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="budgetRange">Budget range</label>
        <select
          id="budgetRange"
          value={values.budgetRange}
          onChange={(e) => handleChange("budgetRange", e.target.value)}
          onBlur={() => handleBlur("budgetRange")}
          aria-invalid={Boolean(touched.budgetRange && errors.budgetRange)}
          aria-describedby="budget-error"
        >
          <option value="">Select a range</option>
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {touched.budgetRange && errors.budgetRange && (
          <p className="field-error" id="budget-error">{errors.budgetRange}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="message">What are you trying to build?</label>
        <textarea
          id="message"
          rows={4}
          value={values.message}
          onChange={(e) => handleChange("message", e.target.value)}
          onBlur={() => handleBlur("message")}
          aria-invalid={Boolean(touched.message && errors.message)}
          aria-describedby="message-error"
        />
        {touched.message && errors.message && (
          <p className="field-error" id="message-error">{errors.message}</p>
        )}
      </div>

      {submitState === "error" && (
        <p className="form-error" role="alert">{serverError}</p>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitState === "sending"}>
        {submitState === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
