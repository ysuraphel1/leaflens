import { useEffect, useState } from 'react'
import { getCare, createJournalEntry } from '../api'

function MetricChip({ label, value }) {
  return (
    <span className="metric-chip">
      {label}: {(value * 100).toFixed(1)}%
    </span>
  )
}

function ConfidenceBar({ label, sublabel, confidence }) {
  return (
    <li className="alt-item">
      <div className="alt-label">
        <span>{label} <em style={{ color: 'var(--gray-500)', fontStyle: 'normal', fontSize: '.82rem' }}>{sublabel}</em></span>
        <span style={{ fontWeight: 600 }}>{(confidence * 100).toFixed(1)}%</span>
      </div>
      <div className="bar-bg">
        <div className="bar-fill" style={{ width: `${confidence * 100}%` }} />
      </div>
    </li>
  )
}

const SEVERITY_LEVELS = ['none', 'mild', 'moderate', 'severe']

const SEVERITY_META = {
  none:     { label: 'Safe',     color: '#16a34a', bg: '#dcfce7', icon: '✓' },
  mild:     { label: 'Mild',     color: '#ca8a04', bg: '#fef9c3', icon: '!' },
  moderate: { label: 'Moderate', color: '#ea580c', bg: '#ffedd5', icon: '⚠' },
  severe:   { label: 'Severe',   color: '#dc2626', bg: '#fee2e2', icon: '✕' },
}

function ToxicitySpectrum({ label, severity }) {
  const level = SEVERITY_LEVELS.includes(severity) ? severity : 'none'
  const activeIdx = SEVERITY_LEVELS.indexOf(level)
  const meta = SEVERITY_META[level]

  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
        <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{label}</span>
        <span style={{
          background: meta.bg,
          color: meta.color,
          fontWeight: 700,
          fontSize: '.8rem',
          padding: '.15rem .55rem',
          borderRadius: '999px',
        }}>
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Spectrum track */}
      <div style={{ display: 'flex', gap: '3px', height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
        {SEVERITY_LEVELS.map((s, i) => {
          const m = SEVERITY_META[s]
          const isActive = i === activeIdx
          return (
            <div
              key={s}
              style={{
                flex: 1,
                background: isActive ? m.color : m.bg,
                border: isActive ? `2px solid ${m.color}` : `1px solid ${m.bg}`,
                borderRadius: i === 0 ? '6px 0 0 6px' : i === 3 ? '0 6px 6px 0' : '0',
                transition: 'background .3s',
              }}
            />
          )
        })}
      </div>

      {/* Scale labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.25rem' }}>
        {SEVERITY_LEVELS.map(s => (
          <span key={s} style={{
            fontSize: '.68rem',
            color: s === level ? SEVERITY_META[s].color : 'var(--gray-500)',
            fontWeight: s === level ? 700 : 400,
            textTransform: 'capitalize',
          }}>
            {SEVERITY_META[s].label}
          </span>
        ))}
      </div>
    </div>
  )
}

function ToxicitySection({ toxicPets, toxicChildren, severityPets, severityChildren, details }) {
  if (toxicPets === null && toxicChildren === null) return null

  // Fall back: if severity missing but boolean is set, infer a level
  const petLevel   = severityPets   || (toxicPets   ? 'moderate' : 'none')
  const childLevel = severityChildren || (toxicChildren ? 'moderate' : 'none')

  return (
    <div className="card">
      <p className="card-title">Toxicity Warnings</p>
      <ToxicitySpectrum label="Pets" severity={petLevel} />
      <ToxicitySpectrum label="Children" severity={childLevel} />
      {details && (
        <p style={{ marginTop: '.5rem', fontSize: '.85rem', color: 'var(--gray-700)', borderTop: '1px solid var(--gray-100)', paddingTop: '.75rem' }}>
          {details}
        </p>
      )}
    </div>
  )
}

function DiseaseSection({ diseases }) {
  if (!diseases || diseases.length === 0) return (
    <div className="card">
      <p className="card-title">Disease & Pest Detection</p>
      <p style={{ color: 'var(--gray-500)', fontSize: '.9rem' }}>No diseases or pests detected in this image.</p>
    </div>
  )
  return (
    <div className="card">
      <p className="card-title">Disease & Pest Detection</p>
      {diseases.map((d, i) => (
        <div key={i} className="disease-item">
          <div className="d-name">{d.name} <span className="severity">· {d.severity}</span></div>
          <div className="d-desc">{d.description}</div>
        </div>
      ))}
    </div>
  )
}

// ── Care sub-components ──────────────────────────────────────────────────────

function CareSubSection({ title, children }) {
  return (
    <div style={{ marginTop: '1.25rem' }}>
      <p style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.6rem', color: 'var(--green-900)' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function KeyValueGrid({ data, skip = [] }) {
  if (!data) return null
  const entries = Object.entries(data).filter(
    ([k, v]) => !skip.includes(k) && v !== null && v !== undefined && v !== ''
  )
  if (!entries.length) return null
  return (
    <div className="care-grid">
      {entries.map(([k, v]) => (
        <div key={k} className="care-item">
          <div className="ci-label">{k.replace(/_/g, ' ')}</div>
          <div className="ci-value" style={{ fontSize: '.85rem' }}>{String(v)}</div>
        </div>
      ))}
    </div>
  )
}

function ProblemList({ problems }) {
  if (!problems || !problems.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      {problems.map((p, i) => (
        <div key={i} style={{ background: 'var(--gray-100)', borderRadius: 8, padding: '.75rem' }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.3rem' }}>
            {p.problem}
          </div>
          {p.cause && <div style={{ fontSize: '.83rem', color: 'var(--gray-700)' }}><strong>Cause:</strong> {p.cause}</div>}
          {p.symptoms && <div style={{ fontSize: '.83rem', color: 'var(--gray-700)' }}><strong>Symptoms:</strong> {p.symptoms}</div>}
          {p.solution && <div style={{ fontSize: '.83rem', color: 'var(--green-900)' }}><strong>Fix:</strong> {p.solution}</div>}
          {p.prevention && <div style={{ fontSize: '.83rem', color: 'var(--gray-500)' }}><strong>Prevent:</strong> {p.prevention}</div>}
        </div>
      ))}
    </div>
  )
}

function BestPractices({ tips }) {
  if (!tips || !tips.length) return null
  return (
    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
      {tips.map((t, i) => (
        <li key={i} style={{ fontSize: '.88rem', color: 'var(--gray-700)' }}>{t}</li>
      ))}
    </ul>
  )
}

function buildPDF(jsPDF, care, commonName, scientificName, imageDataUrl) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 210mm
  const H = doc.internal.pageSize.getHeight()  // 297mm
  const MARGIN = 16
  const CONTENT_W = W - MARGIN * 2
  const FOOTER_Y = H - 8
  const BODY_BOTTOM = FOOTER_Y - 6   // leave room for footer

  let y = MARGIN

  // ── Cursor helpers ────────────────────────────────────────────────────────
  function newPage() {
    doc.addPage()
    y = MARGIN
  }

  function ensureSpace(mm) {
    if (y + mm > BODY_BOTTOM) newPage()
  }

  // Advance y and optionally break page, then return new y
  function advance(mm) {
    y += mm
    if (y > BODY_BOTTOM) newPage()
  }

  // ── Typography helpers ────────────────────────────────────────────────────
  const LINE_H = 5.2   // consistent body line height throughout

  function setBody() {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
  }

  function wrappedText(text, x, maxW) {
    // Returns number of lines written; advances y accordingly
    if (!text && text !== 0) return
    const str = String(text)
    const lines = doc.splitTextToSize(str, maxW)
    lines.forEach(line => {
      ensureSpace(LINE_H)
      doc.text(line, x, y)
      advance(LINE_H)
    })
  }

  function sectionHeading(text) {
    ensureSpace(14)
    advance(3)   // breathing room before heading
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(21, 128, 61)
    doc.text(text, MARGIN, y)
    advance(2)
    doc.setDrawColor(200, 230, 210)
    doc.setLineWidth(0.4)
    doc.line(MARGIN, y, W - MARGIN, y)
    advance(4)
  }

  function labelRow(label, value, indent = 0) {
    if (value === null || value === undefined || value === '' || typeof value === 'object') return
    const labelText = label.replace(/_/g, ' ')
    const LABEL_W = 38
    const valueX = MARGIN + indent + LABEL_W + 2
    const valueW = CONTENT_W - indent - LABEL_W - 2

    // Measure wrapped value lines first so we can check page space
    setBody()
    const valueLines = doc.splitTextToSize(String(value), valueW)
    ensureSpace(valueLines.length * LINE_H + 1)

    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(107, 114, 128)
    doc.text(labelText + ':', MARGIN + indent, y)

    // Value (first line aligned with label)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
    doc.text(valueLines[0], valueX, y)
    advance(LINE_H)

    // Overflow lines indented under value column
    for (let i = 1; i < valueLines.length; i++) {
      ensureSpace(LINE_H)
      doc.text(valueLines[i], valueX, y)
      advance(LINE_H)
    }
    advance(0.8)  // small gap between rows
  }

  function kvBlock(data, indent = 0) {
    if (!data || typeof data !== 'object') return
    Object.entries(data).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '' && typeof v !== 'object' && typeof v !== 'boolean') {
        labelRow(k, v, indent)
      }
    })
  }

  function bulletItem(text, indent = 5) {
    if (!text) return
    setBody()
    const valueW = CONTENT_W - indent - 3
    const lines = doc.splitTextToSize(String(text), valueW)
    ensureSpace(lines.length * LINE_H)
    doc.text('•', MARGIN + indent - 3.5, y)
    doc.text(lines[0], MARGIN + indent, y)
    advance(LINE_H)
    for (let i = 1; i < lines.length; i++) {
      ensureSpace(LINE_H)
      doc.text(lines[i], MARGIN + indent, y)
      advance(LINE_H)
    }
    advance(0.5)
  }

  // ── Draw page footer (called at end for all pages) ────────────────────────
  function drawFooters() {
    const total = doc.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7)
      doc.setTextColor(180, 180, 180)
      doc.text(
        'LeafLens · Powered by OpenAI GPT-4o · AI-generated — verify with a qualified botanist for critical decisions.',
        MARGIN, FOOTER_Y
      )
      doc.text(`${i} / ${total}`, W - MARGIN, FOOTER_Y, { align: 'right' })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Cover header
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setFillColor(20, 83, 45)
  doc.rect(0, 0, W, 44, 'F')

  // Plant photo — top-right corner of cover banner
  if (imageDataUrl) {
    try {
      const imgX = W - MARGIN - 36
      doc.addImage(imageDataUrl, 'JPEG', imgX, 4, 35, 35)
    } catch {
      // image embedding failed silently — no photo in PDF
    }
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(160, 220, 180)
  doc.text('Plant Care Guide', MARGIN, 12)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  // Wrap common name if very long
  const titleLines = doc.splitTextToSize(commonName, CONTENT_W - 10)
  titleLines.forEach((line, i) => doc.text(line, MARGIN, 21 + i * 8))

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(180, 230, 195)
  doc.text(scientificName, MARGIN, 38)

  y = 52

  // Generated-by line
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(160, 160, 160)
  doc.text(`Generated by LeafLens · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, MARGIN, y)
  advance(10)

  // ═══════════════════════════════════════════════════════════════════════════
  // Quick Reference
  // ═══════════════════════════════════════════════════════════════════════════
  sectionHeading('Quick Reference')

  const qi = care.growth_info || {}
  ;[
    ['Difficulty',    qi.difficulty_level],
    ['Growth rate',   qi.growth_rate],
    ['Mature height', qi.mature_height],
    ['Mature spread', qi.mature_spread],
    ['Lifespan',      qi.lifespan],
  ].forEach(([l, v]) => v && labelRow(l, v))

  advance(2)

  ;[
    ['Watering',    care.watering_frequency],
    ['Sunlight',    care.sunlight],
    ['Soil',        care.soil_type],
    ['Humidity',    care.humidity],
    ['Temperature', care.temperature_range],
    ['Fertilizing', care.fertilizing],
  ].forEach(([l, v]) => v && labelRow(l, v))

  // ═══════════════════════════════════════════════════════════════════════════
  // Detailed sections
  // ═══════════════════════════════════════════════════════════════════════════

  if (care.light_requirements) {
    sectionHeading('Light Requirements')
    kvBlock(care.light_requirements)
  }

  if (care.watering_guide) {
    sectionHeading('Watering Guide')
    kvBlock(care.watering_guide)
  }

  if (care.soil_and_potting) {
    sectionHeading('Soil & Potting')
    kvBlock(care.soil_and_potting)
  }

  if (care.feeding) {
    sectionHeading('Feeding Schedule')
    kvBlock(care.feeding)
  }

  if (care.pruning_and_maintenance) {
    sectionHeading('Pruning & Maintenance')
    kvBlock(care.pruning_and_maintenance)
  }

  if (care.propagation) {
    sectionHeading('Propagation')
    kvBlock(care.propagation)
  }

  if (care.best_practices?.length) {
    sectionHeading('Best Practices')
    care.best_practices.forEach(t => bulletItem(t))
  }

  if (care.common_problems?.length) {
    sectionHeading('Common Problems & Solutions')
    care.common_problems.forEach(p => {
      ensureSpace(20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(30, 30, 30)
      doc.text(p.problem || '', MARGIN, y)
      advance(LINE_H + 1)
      ;[
        ['Cause',      p.cause],
        ['Symptoms',   p.symptoms],
        ['Solution',   p.solution],
        ['Prevention', p.prevention],
      ].forEach(([l, v]) => v && labelRow(l, v, 4))
      advance(2)
    })
  }

  const seasonal = care.seasonal_care || {}
  if (Object.values(seasonal).some(Boolean)) {
    sectionHeading('Seasonal Care')
    ;['spring', 'summer', 'autumn', 'winter'].forEach(s => {
      if (!seasonal[s]) return
      ensureSpace(12)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(21, 128, 61)
      doc.text(s.charAt(0).toUpperCase() + s.slice(1), MARGIN, y)
      advance(LINE_H)
      setBody()
      wrappedText(seasonal[s], MARGIN + 4, CONTENT_W - 4)
      advance(2)
    })
  }

  const env = care.environment || {}
  if (env.air_purifying_notes || env.outdoor_notes) {
    sectionHeading('Environment')
    if (env.air_purifying_notes) labelRow('Air quality', env.air_purifying_notes)
    if (env.outdoor_notes) labelRow('Outdoor use', env.outdoor_notes)
  }

  drawFooters()

  return doc
}

function readExifOrientation(buf) {
  const view = new DataView(buf)
  if (view.getUint16(0) !== 0xFFD8) return 1
  let offset = 2
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset)
    offset += 2
    if (marker === 0xFFE1) {
      if (view.getUint32(offset + 2) !== 0x45786966) break // not 'Exif'
      const le = view.getUint16(offset + 8) === 0x4949
      const tiff = offset + 8
      const dir = tiff + view.getUint32(tiff + 4, le)
      const entries = view.getUint16(dir, le)
      for (let i = 0; i < entries; i++) {
        const e = dir + 2 + i * 12
        if (view.getUint16(e, le) === 0x0112) return view.getUint16(e + 8, le)
      }
      break
    } else if ((marker & 0xFF00) !== 0xFF00) {
      break
    } else {
      offset += view.getUint16(offset)
    }
  }
  return 1
}

async function fetchImageAsDataUrl(imageFilename) {
  try {
    const resp = await fetch(`/uploads/${imageFilename}`)
    if (!resp.ok) return null
    const blob = await resp.blob()
    const buf = await blob.slice(0, 64 * 1024).arrayBuffer()
    const orientation = readExifOrientation(buf)

    const url = URL.createObjectURL(blob)
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    URL.revokeObjectURL(url)

    // Orientations 5-8 swap width/height
    const swap = orientation >= 5
    const canvas = document.createElement('canvas')
    canvas.width = swap ? img.height : img.width
    canvas.height = swap ? img.width : img.height
    const ctx = canvas.getContext('2d')
    // Apply the EXIF transform so pixel data is upright before jsPDF reads it
    switch (orientation) {
      case 2: ctx.transform(-1,  0,  0,  1, img.width,              0); break
      case 3: ctx.transform(-1,  0,  0, -1, img.width,     img.height); break
      case 4: ctx.transform( 1,  0,  0, -1,          0,     img.height); break
      case 5: ctx.transform( 0,  1,  1,  0,          0,              0); break
      case 6: ctx.transform( 0,  1, -1,  0, img.height,              0); break
      case 7: ctx.transform( 0, -1, -1,  0, img.height,     img.width); break
      case 8: ctx.transform( 0, -1,  1,  0,          0,     img.width); break
    }
    ctx.drawImage(img, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    return null
  }
}

function CareSection({ identId, scientificName, commonName, imageFilename }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function downloadPDF() {
    setLoading(true)
    setError(null)
    try {
      const [{ jsPDF }, care, imageDataUrl] = await Promise.all([
        import('jspdf'),
        getCare(identId),
        imageFilename ? fetchImageAsDataUrl(imageFilename) : Promise.resolve(null),
      ])
      const doc = buildPDF(jsPDF, care, commonName, scientificName, imageDataUrl)
      doc.setProperties({ title: `${commonName} Care Guide — LeafLens` })
      const slug = commonName.replace(/\s+/g, '_').toLowerCase()
      doc.save(`${slug}_care_guide.pdf`)
    } catch {
      setError('Failed to generate care guide. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (error) return (
    <div className="card">
      <p className="card-title">Care Guide PDF</p>
      <div className="alert alert-error" style={{ marginBottom: '.75rem' }}>{error}</div>
      <button className="btn btn-primary" onClick={downloadPDF}>Retry Download</button>
    </div>
  )

  return (
    <div className="card">
      <p className="card-title" style={{ marginBottom: '.3rem' }}>Care Guide</p>
      <p style={{ fontSize: '.82rem', color: 'var(--gray-500)', marginBottom: '.85rem', lineHeight: 1.5 }}>
        Full report: light, watering, soil, feeding, propagation &amp; more.
      </p>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={downloadPDF} disabled={loading}>
        {loading
          ? <><span className="spinner" /> Generating…</>
          : <>&#8595; Download PDF</>}
      </button>
    </div>
  )

}

function JournalSaveSection({ identId }) {
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setLoading(true)
    setError(null)
    try {
      const entry = await createJournalEntry({ identification_id: identId, notes: notes || null })
      setSaved(entry)
    } catch {
      setError('Failed to save journal entry.')
    } finally {
      setLoading(false)
    }
  }

  if (saved) return (
    <div className="card">
      <p className="card-title">Journal</p>
      <div className="alert alert-info">Saved to journal!</div>
    </div>
  )

  return (
    <div className="card">
      <p className="card-title">Save to Plant Journal</p>
      <textarea
        className="journal-area"
        placeholder="Add notes (optional)…"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <div style={{ marginTop: '.75rem' }}>
        <button className="btn btn-primary" onClick={save} disabled={loading}>
          {loading ? <><span className="spinner" /> Saving…</> : 'Save Entry'}
        </button>
      </div>
      {error && <div className="alert alert-error" style={{ marginTop: '.75rem' }}>{error}</div>}
    </div>
  )
}

export default function ResultsView({ result, onReset }) {
  if (!result) return null
  const topConfidence = result.confidence

  return (
    <div>
      {/* ── Dashboard header strip ── */}
      <div className="dash-header">
        {/* Left: plant identity */}
        <div style={{ minWidth: 0 }}>
          <h2 style={{
            fontSize: 'clamp(1.35rem, 3vw, 1.85rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.15,
            marginBottom: '.3rem',
          }}>
            {result.common_name}
          </h2>
          <p style={{
            fontStyle: 'italic',
            color: 'rgba(180,230,195,.85)',
            fontSize: '.95rem',
            marginBottom: '.7rem',
          }}>
            {result.scientific_name}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
            {result.family && (
              <span style={{
                background: 'rgba(255,255,255,.12)',
                color: '#dcfce7',
                borderRadius: '999px',
                padding: '.2rem .65rem',
                fontSize: '.78rem',
                fontWeight: 500,
              }}>
                Family: {result.family}
              </span>
            )}
            {result.genus && (
              <span style={{
                background: 'rgba(255,255,255,.12)',
                color: '#dcfce7',
                borderRadius: '999px',
                padding: '.2rem .65rem',
                fontSize: '.78rem',
                fontWeight: 500,
              }}>
                Genus: {result.genus}
              </span>
            )}
          </div>
        </div>

        {/* Right: metrics + action */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.75rem', flexShrink: 0 }}>
          <div className="dash-metric-grid">
            <MetricChip label="Confidence" value={topConfidence} />
            <MetricChip label="Precision"  value={result.precision} />
            <MetricChip label="Recall"     value={result.recall} />
            <MetricChip label="F1"         value={result.f1} />
          </div>
          <button
            className="btn btn-ghost"
            onClick={onReset}
            style={{ color: 'var(--white)', borderColor: 'rgba(255,255,255,.35)', fontSize: '.85rem', padding: '.35rem .9rem' }}
          >
            ← New Upload
          </button>
        </div>
      </div>

      {/* ── 3-column dashboard grid ── */}
      <div className="dash-grid">

        {/* ── Left column: image + care guide ── */}
        <div>
          {result.image_filename && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '.875rem' }}>
              <img
                src={`/uploads/${result.image_filename}`}
                alt="Uploaded plant"
                style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}
          <CareSection
            identId={result.id}
            scientificName={result.scientific_name}
            commonName={result.common_name}
            imageFilename={result.image_filename}
          />
        </div>

        {/* ── Center column: description + alternatives + diseases ── */}
        <div>
          {result.description && (
            <div className="card">
              <p className="card-title">About this Plant</p>
              <p style={{ fontSize: '.9rem', color: 'var(--gray-700)', lineHeight: 1.65 }}>
                {result.description}
              </p>
            </div>
          )}

          {result.alternatives && result.alternatives.length > 0 && (
            <div className="card">
              <p className="card-title">Species Confidence</p>
              <ul className="alt-list">
                <ConfidenceBar
                  label={result.common_name}
                  sublabel={result.scientific_name}
                  confidence={topConfidence}
                />
                {result.alternatives.map((alt, i) => (
                  <ConfidenceBar
                    key={i}
                    label={alt.common_name}
                    sublabel={alt.scientific_name}
                    confidence={alt.confidence}
                  />
                ))}
              </ul>
            </div>
          )}

          <DiseaseSection diseases={result.diseases} />
        </div>

        {/* ── Right column: toxicity + journal ── */}
        <div>
          <ToxicitySection
            toxicPets={result.toxic_to_pets}
            toxicChildren={result.toxic_to_children}
            severityPets={result.toxicity_severity_pets}
            severityChildren={result.toxicity_severity_children}
            details={result.toxicity_details}
          />
          <JournalSaveSection identId={result.id} />
        </div>

      </div>
    </div>
  )
}
