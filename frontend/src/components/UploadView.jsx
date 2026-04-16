import { useRef, useState } from 'react'
import { identifyPlant } from '../api'

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
      <div className="card">
        <h2 style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '1.55rem',
          fontWeight: 400,
          color: 'var(--green-900)',
          marginBottom: '.25rem',
          lineHeight: 1.2,
        }}>
          Identify Any Plant
        </h2>
        <p style={{
          fontSize: '.9rem',
          color: 'var(--gray-500)',
          marginBottom: '1.25rem',
          fontWeight: 400,
        }}>
          Upload a photo and instantly receive species identification, toxicity warnings, disease detection, and expert-level care instructions.
        </p>

        {preview ? (
          <div>
            <img src={preview} alt="Preview" className="preview-img" />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
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
            <div className="icon">🌿</div>
            <p>Drag & drop a plant photo here, or click to browse</p>
            <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
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
