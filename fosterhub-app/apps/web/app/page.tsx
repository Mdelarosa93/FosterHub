import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="hero split-hero">
        <div>
          <span className="badge">FosterHub MVP refinement</span>
          <h1 style={{ fontSize: 48, lineHeight: 1.04, marginTop: 18, marginBottom: 18 }}>
            A calmer, clearer operating system for foster care work.
          </h1>
          <p style={{ fontSize: 18, maxWidth: 700 }}>
            FosterHub is moving from raw implementation scaffolding into a more credible MVP.
            The current focus is refining the worker experience, tightening workflows, and making
            the product feel trustworthy enough for real internal review.
          </p>
          <div className="actions-row" style={{ marginTop: 28 }}>
            <Link href="/login" className="button button-primary">Open development login</Link>
            <Link href="/dashboard" className="button button-ghost">Go to dashboard</Link>
          </div>
        </div>

        <aside className="info-panel">
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.78)' }}>Current build focus</div>
          <div className="info-list">
            <div>
              <strong>Worker dashboard</strong>
              <span>Surface workload, priorities, and pending requests more clearly.</span>
            </div>
            <div>
              <strong>Intake to case flow</strong>
              <span>Make the path from incoming child record to active case feel obvious and safe.</span>
            </div>
            <div>
              <strong>Case operations</strong>
              <span>Keep assignments, requests, and documents organized in one place.</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
