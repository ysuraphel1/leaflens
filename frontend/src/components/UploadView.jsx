import { useRef, useState } from 'react'
import { identifyPlant } from '../api'

const FEATURES = [
  { icon: '🔍', label: 'Species ID' },
  { icon: '💧', label: 'Care Guide' },
  { icon: '🛡️', label: 'Toxicity Check' },
  { icon: '🦠', label: 'Disease Detection' },
]

export default function UploadView({ onResult }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFile(f) {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const result = await identifyPlant(file)
      onResult(result)
    } catch (err) {
      setError(err.response?.data?.detail || 'Identification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem 2rem' }}>
        <h1 style={{
          fontSize: 'clamp(1.9rem, 5vw, 2.6rem)',
          fontWeight: 800,
          color: 'var(--green-900)',
          letterSpacing: '-.5px',
          lineHeight: 1.15,
          marginBottom: '.65rem',
        }}>
          Let LeafLens Do the Looking.
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--gray-500)',
          maxWidth: '480px',
          margin: '0 auto 1.75rem',
          lineHeight: 1.6,
          fontWeight: 400,
        }}>
          Upload a photo and instantly get species identification, expert care instructions, toxicity warnings, and disease detection.
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {FEATURES.map(f => (
            <span key={f.label} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.35rem',
              background: 'var(--white)',
              border: '1px solid var(--gray-200)',
              borderRadius: '999px',
              padding: '.3rem .85rem',
              fontSize: '.8rem',
              fontWeight: 600,
              color: 'var(--gray-700)',
              boxShadow: '0 1px 3px rgba(0,0,0,.06)',
            }}>
              {f.icon} {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Upload card ── */}
      <div className="card" style={{ maxWidth: '560px', margin: '0 auto' }}>
        {preview ? (
          <div>
            <img src={preview} alt="Preview" className="preview-img" />
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner" /> Identifying…</> : 'Identify Plant'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setPreview(null); setFile(null); setError(null) }}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`upload-zone${dragging ? ' drag-over' : ''}`}
            onClick={() => inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🌿</div>
            <p style={{ fontWeight: 600, color: 'var(--gray-700)', marginBottom: '.25rem' }}>
              Drop your photo here
            </p>
            <p style={{ fontSize: '.82rem', color: 'var(--gray-500)' }}>
              or <span style={{ color: 'var(--green-700)', fontWeight: 600, cursor: 'pointer' }}>browse to upload</span>
            </p>
            <p style={{ fontSize: '.75rem', color: 'var(--gray-500)', marginTop: '.5rem' }}>
              JPG, PNG, WebP — max 10 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp"
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
      </div>
    </div>
  )
}
