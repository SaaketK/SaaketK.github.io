/* global React */

const COMPACT_PROJECTS = [
  {
    name: "Vamana Book Discovery",
    description: "Semantic book search backed by a Vamana ANNS index built from scratch in C++.",
    stack: "C++ · OpenMP · ctypes · FastAPI · React",
    href: "https://github.com/SaaketK/SaaketK.github.io/tree/main/backend/recommender",
  },
  {
    name: "Physics-Informed Neural Networks",
    description: "PINN research across mechanics, quantum systems, finance, and inverse problems.",
    stack: "C · Python · PyTorch · NumPy · SciPy",
    href: "https://github.com/SaaketK/PINN",
  },
  {
    name: "Forge",
    description: "Multi-agent C code auditing, patch generation, and verification in Docker.",
    stack: "Python · LangGraph · Claude API · Docker",
    href: "https://github.com/SaaketK/Forge",
  },
  {
    name: "safepip",
    description: "A pip security wrapper that detects likely PyPI typosquatting attempts.",
    stack: "Python · C · PyPI API · GitHub API",
    href: "https://github.com/SaaketK/Safepip",
  },
];

const COMPACT_SKILLS = [
  "C", "C++", "Python", "JavaScript", "React", "PyTorch",
  "FastAPI", "OpenMP", "CUDA", "Docker", "Linux", "Git",
];

const COMPACT_INTERESTS = [
  "Computer architecture",
  "Systems programming",
  "High-performance computing",
  "Quantum computing",
  "Optimization algorithms",
];

function PortfolioPage() {
  return (
    <main className="portfolio-page compact-portfolio">
      <div className="compact-layout">
        <aside className="compact-left">
          <header className="compact-identity">
            <p className="compact-kicker">Hello, I’m</p>
            <h1>Saaket Kulkarni</h1>
            <p>I build performance-focused software and study the systems underneath it.</p>
            <div className="compact-links">
              <a href="mailto:saaket.bgk@gmail.com">Email ↗</a>
              <a href="https://github.com/SaaketK" target="_blank" rel="noreferrer">GitHub ↗</a>
              <a href="https://linkedin.com/in/saaket-kulkarni" target="_blank" rel="noreferrer">LinkedIn ↗</a>
            </div>
          </header>

          <section className="compact-block compact-background">
            <h2>Background</h2>
            <article>
              <div><strong>ANNS Systems Research</strong><time>Summer 2026</time></div>
              <p>Profiled HNSW and Vamana algorithms on Intel AMX hardware with query batching.</p>
            </article>
            <article>
              <div><strong>Software Engineering Intern</strong><time>Summer 2025</time></div>
              <p>Cardaverse · Full-stack and web engineering.</p>
            </article>
            <article>
              <div><strong>Computer Science · NJIT</strong><time>Education</time></div>
              <p>Albert Dorman Honors College<br />Minors in Computer Engineering and Computational Mathematics.</p>
            </article>
          </section>

          <section className="compact-block compact-interests">
            <h2>Interests</h2>
            <ul>
              {COMPACT_INTERESTS.map((interest) => <li key={interest}>{interest}</li>)}
            </ul>
          </section>
        </aside>

        <section className="compact-right">
          <section className="compact-block compact-skills">
            <h2>Skills</h2>
            <div>
              {COMPACT_SKILLS.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          </section>

          <section className="compact-block compact-projects">
            <h2>Projects</h2>
            <div className="compact-project-list">
              {COMPACT_PROJECTS.map((project) => (
                <a href={project.href} target="_blank" rel="noreferrer" key={project.name}>
                  <div className="compact-project-heading">
                    <h3>{project.name}</h3>
                    <i aria-hidden="true">↗</i>
                  </div>
                  <p>{project.description}</p>
                  <span>{project.stack}</span>
                </a>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
