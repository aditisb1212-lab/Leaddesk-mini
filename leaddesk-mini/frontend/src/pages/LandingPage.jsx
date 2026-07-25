import LeadForm from "../components/LeadForm.jsx";
import Footer from "../components/Footer.jsx";
import "./LandingPage.css";

// Signature element: a three-stage "pipeline strip" - New / Contacted / Closed -
// echoing the exact admin status flow, so the visitor sees the product's own
// mental model before they've even submitted a lead.
function PipelineStrip() {
  return (
    <div className="pipeline-strip" aria-hidden="true">
      <div className="pipeline-stage stage-new">
        <span className="stage-dot" />
        <span className="stage-label">New</span>
      </div>
      <div className="pipeline-track" />
      <div className="pipeline-stage stage-contacted">
        <span className="stage-dot" />
        <span className="stage-label">Contacted</span>
      </div>
      <div className="pipeline-track" />
      <div className="pipeline-stage stage-closed">
        <span className="stage-dot" />
        <span className="stage-label">Closed</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="wordmark">LeadDesk</span>
        <a className="admin-link" href="/admin/login">Admin</a>
      </header>

      <main className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">Lead capture, minus the busywork</p>
          <h1>
            Every inquiry lands in <em>one place</em> - and moves.
          </h1>
          <p className="hero-sub">
            Tell us what you're building and your budget, and it's in front of
            a human within one business day.
          </p>
          <PipelineStrip />
        </div>

        <div className="hero-form">
          <LeadForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
