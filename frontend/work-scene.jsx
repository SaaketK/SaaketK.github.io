/* global React */

function WorkScene({ embedded = false, onReturn }) {
  return (
    <main className="screen-page">
      <div className="screen-page__reflection" aria-hidden="true" />

      <header className="screen-page__header">
        <span>Saaket Kulkarni / screen</span>
        <span>03 / work</span>
        <div>
          {embedded ? (
            <button className="screen-page__back" type="button" onClick={onReturn}>← mind</button>
          ) : (
            <a className="screen-page__back" href="./?scene=brain">← mind</a>
          )}
        </div>
      </header>

      <section className="screen-page__identity" aria-label="About Saaket">
        <div className="screen-page__identity-half">
          <h1>Hi, I am Saaket</h1>
          <p>Minors: Computer Engineering,</p>
        </div>
        <div className="screen-page__identity-half">
          <h1>CS @ NJIT ADHC</h1>
          <p>Computational Mathematics</p>
        </div>
      </section>

      <section className="screen-page__work" aria-labelledby="screen-work-title">
        <div className="screen-page__work-heading">
          <p>what was below the eye line</p>
          <h2 id="screen-work-title">Work</h2>
          <span>2025—2026</span>
        </div>

        <div className="screen-page__records">
          <article className="screen-record screen-record--current">
            <div className="screen-record__number">01</div>
            <div className="screen-record__copy">
              <div className="screen-record__meta">
                <span>current research</span>
                <time>summer 2026</time>
              </div>
              <h3>ANNS algorithm performance</h3>
              <p>
                Researching ANNS algorithm performance on Intel AMX CPUs and
                high-performance GPU clusters.
              </p>
            </div>
            <div className="screen-record__tags" aria-label="Research areas">
              <span>ANNS</span>
              <span>Intel AMX</span>
              <span>GPU clusters</span>
              <span>performance</span>
            </div>
          </article>

          <article className="screen-record screen-record--past">
            <div className="screen-record__number">02</div>
            <div className="screen-record__copy">
              <div className="screen-record__meta">
                <span>past work</span>
                <time>summer 2025</time>
              </div>
              <h3>Software Engineering Intern · Cardaverse</h3>
              <p>Web development frameworks and full-stack engineering.</p>
            </div>
            <div className="screen-record__tags" aria-label="Engineering areas">
              <span>full stack</span>
              <span>web frameworks</span>
              <span>engineering</span>
            </div>
          </article>
        </div>
      </section>

      <footer className="screen-page__footer">
        <span>full screen / uncropped</span>
        <span>scroll up to return through the eyes ↑</span>
      </footer>
    </main>
  );
}
