import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, getIdentification, updateJournalEntry, deleteJournalEntry } from '../api'

function HistoryRow({ item, onClick }) {
  return (
    <tr onClick={() => onClick(item.id)}>
      <td>
        <img
          src={`/uploads/${item.image_filename}`}
          alt={item.common_name}
          className="thumb"
          onError={e => { e.target.style.display = 'none' }}
        />
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{item.common_name}</div>
        <div style={{ fontSize: '.82rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>{item.scientific_name}</div>
      </td>
      <td><span className="conf-badge">{(item.confidence * 100).toFixed(1)}%</span></td>
      <td style={{ color: 'var(--gray-500)', fontSize: '.82rem' }}>
        {new Date(item.created_at).toLocaleDateString()}
      </td>
    </tr>
  )
}

function JournalEntryCard({ entry, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(entry.notes || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const updated = await updateJournalEntry(entry.id, { notes })
      onUpdate(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this journal entry?')) return
    await deleteJournalEntry(entry.id)
    onDelete(entry.id)
  }

  return (
    <div className="card" style={{ marginBottom: '.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '.8rem', color: 'var(--gray-500)' }}>
            {new Date(entry.created_at).toLocaleString()}
          </div>
          {entry.hardiness_zone && (
            <div style={{ marginTop: '.25rem' }}>
              USDA Zone: <span className="zone-badge">{entry.hardiness_zone}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-ghost" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button className="btn btn-danger" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={remove}>
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <div style={{ marginTop: '.75rem' }}>
          <textarea
            className="journal-area"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button className="btn btn-primary" style={{ marginTop: '.5rem' }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      ) : (
        <p style={{ marginTop: '.5rem', fontSize: '.9rem', color: 'var(--gray-700)' }}>
          {entry.notes || <em style={{ color: 'var(--gray-500)' }}>No notes</em>}
        </p>
      )}
    </div>
  )
}

function IdentificationDetail({ ident, onClose }) {
  const [entries, setEntries] = useState(ident.journal_entries || [])

  function handleUpdate(updated) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  function handleDelete(id) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: 700 }}>{ident.common_name}</h2>
          <p style={{ fontStyle: 'italic', color: 'var(--gray-500)', fontSize: '.9rem' }}>{ident.scientific_name}</p>
        </div>
        <button className="btn btn-ghost" onClick={onClose}>← Back</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <img
            src={`/uploads/${ident.image_filename}`}
            alt={ident.common_name}
            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <div>
            <div className="taxonomy-row">
              {ident.family && <span className="tax-pill"><span>Family:</span> {ident.family}</span>}
              {ident.genus && <span className="tax-pill"><span>Genus:</span> {ident.genus}</span>}
            </div>
            <div className="metrics-row">
              <span className="metric-chip">Confidence: {(ident.confidence * 100).toFixed(1)}%</span>
              {ident.precision > 0 && <span className="metric-chip">Precision: {(ident.precision * 100).toFixed(1)}%</span>}
              {ident.f1 > 0 && <span className="metric-chip">F1: {(ident.f1 * 100).toFixed(1)}%</span>}
            </div>
            {ident.description && (
              <p style={{ marginTop: '.5rem', fontSize: '.88rem', color: 'var(--gray-700)' }}>{ident.description}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '.75rem' }}>
        <p className="card-title" style={{ marginBottom: '.5rem' }}>Journal Entries</p>
        {entries.length === 0 && (
          <p style={{ color: 'var(--gray-500)', fontSize: '.9rem' }}>No journal entries yet.</p>
        )}
        {entries.map(entry => (
          <JournalEntryCard
            key={entry.id}
            entry={entry}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}

export default function JournalPage() {
  const [history, setHistory] = useState(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const load = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getHistory(p, 20)
      setHistory(data)
    } catch {
      setError('Failed to load history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [page, load])

  async function openDetail(id) {
    try {
      const detail = await getIdentification(id)
      setSelected(detail)
    } catch {
      setError('Failed to load identification detail.')
    }
  }

  if (selected) {
    return (
      <div>
        <IdentificationDetail ident={selected} onClose={() => setSelected(null)} />
      </div>
    )
  }

  const totalPages = history ? Math.ceil(history.total / history.page_size) : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700 }}>Plant Journal</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>+ Identify Plant</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading && <p style={{ color: 'var(--gray-500)' }}>Loading…</p>}
        {!loading && history && history.items.length === 0 && (
          <p style={{ color: 'var(--gray-500)' }}>No identifications yet. Upload a plant photo to get started!</p>
        )}
        {!loading && history && history.items.length > 0 && (
          <table className="history-table">
            <thead>
              <tr>
                <th></th>
                <th>Species</th>
                <th>Confidence</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.items.map(item => (
                <HistoryRow key={item.id} item={item} onClick={openDetail} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn${p === page ? ' active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}
    </div>
  )
}
