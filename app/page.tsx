import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="Placement Portal home">
          <span className="brand-mark">PP</span>
          <span>
            <strong>Placement Portal</strong>
            <small>GBPUAT Pantnagar</small>
          </span>
        </Link>
        <div className="nav-actions">
          <a className="text-link" href="#workspace">Explore workspace</a>
          <a className="button button-dark" href="/login">Sign in <span aria-hidden="true">-&gt;</span></a>
        </div>
      </nav>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Directorate of Placement &amp; Counselling</p>
          <h1 id="hero-title">Make your next move count.</h1>
          <p className="hero-intro">
            One calm, reliable place for every drive, notice, profile, and application at GBPUAT.
          </p>
          <div className="hero-actions">
            <a className="button button-accent" href="/signup">Create student account <span aria-hidden="true">-&gt;</span></a>
            <a className="button button-quiet" href="#workspace">See how it works</a>
          </div>
          <p className="microcopy">College email required. Students and faculty only.</p>
        </div>
        <div className="hero-note" aria-label="Portal principle">
          <span className="note-label">The portal principle</span>
          <p>Every published opportunity is visible to every student. You decide what is right for you.</p>
          <span className="note-rule" />
          <span className="note-foot">Clear information. Better decisions.</span>
        </div>
      </section>

      <section className="workspace" id="workspace" aria-labelledby="workspace-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A shared source of truth</p>
            <h2 id="workspace-title">One workspace, three perspectives.</h2>
          </div>
          <p>Replace scattered messages and hardcopy forms with a live record of the placement journey.</p>
        </div>
        <div className="role-grid">
          <article className="role-card role-student">
            <span className="role-number">01</span>
            <h3>Students</h3>
            <p>Build your profile once, discover every drive, and follow each application from applied to outcome.</p>
            <a href="/signup">Start your profile <span aria-hidden="true">-&gt;</span></a>
          </article>
          <article className="role-card role-admin">
            <span className="role-number">02</span>
            <h3>Placement admin</h3>
            <p>Keep companies, drives, notices, applicants, and reports in one dependable operating view.</p>
            <a href="/login">Admin sign in <span aria-hidden="true">-&gt;</span></a>
          </article>
          <article className="role-card role-faculty">
            <span className="role-number">03</span>
            <h3>Faculty coordinators</h3>
            <p>See the students and applications in your branch, with the context needed to support them.</p>
            <a href="/login">Faculty sign in <span aria-hidden="true">-&gt;</span></a>
          </article>
        </div>
      </section>

      <footer className="footer">
        <span>Built for the people behind every placement.</span>
        <span>GBPUAT &middot; Placement Cell</span>
      </footer>
    </main>
  );
}
