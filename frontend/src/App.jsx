import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import JournalPage from './components/JournalPage'
import ResultsView from './components/ResultsView'
import UploadView from './components/UploadView'

export default function App() {
  const [result, setResult] = useState(null)

  return (
    <div className="app-shell">
      <nav className="navbar">
        <NavLink
          to="/"
          end
          style={{ textDecoration: 'none' }}
          className="brand"
          onClick={() => setResult(null)}
        >🌿 LeafLens</NavLink>
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Identify</NavLink>
        <NavLink to="/journal" className={({ isActive }) => isActive ? 'active' : ''}>Journal</NavLink>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{
            color: 'var(--white)',
            borderColor: 'rgba(255,255,255,.35)',
            padding: '.35rem .9rem',
            fontSize: '.85rem',
          }}>
            Log in
          </button>
          <button className="btn btn-ghost" style={{
            color: 'var(--white)',
            borderColor: 'rgba(255,255,255,.35)',
            padding: '.35rem .9rem',
            fontSize: '.85rem',
          }}>
            Register
          </button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={
          <main className={result ? 'content-wide' : 'content'}>
            {result ? (
              <ResultsView result={result} onReset={() => setResult(null)} />
            ) : (
              <UploadView onResult={setResult} />
            )}
          </main>
        } />
        <Route
          path="/journal"
          element={
            <main className="content">
              <JournalPage />
            </main>
          }
        />
      </Routes>

      <footer style={{
        textAlign: 'center',
        padding: '1.25rem',
        fontSize: '.78rem',
        color: 'var(--gray-500)',
        borderTop: '1px solid var(--gray-200)',
        marginTop: 'auto',
      }}>
        Plant identification and care information powered by{' '}
        <strong style={{ color: 'var(--gray-700)' }}>OpenAI GPT-4o</strong>.
        Results are AI generated and intended as a guide only. Always verify with a qualified botanist for critical decisions.
      </footer>
    </div>
  )
}
