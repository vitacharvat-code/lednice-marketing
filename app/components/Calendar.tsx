'use client'
import { useState, useEffect, useRef } from 'react'
import { MONTHS, FULL_MONTHS, COMPANIES, SERVICES, ACTIVITY_TYPES, Activity } from './data'

export default function Calendar() {
  const [company, setCompany] = useState('pivovar')
  const [allActivities, setAllActivities] = useState<Record<string, Activity[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<{ service: string; month: number } | null>(null)
  const [form, setForm] = useState({ text: '', type: 'promo' })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/activities').then(r => r.json()).then(d => { setAllActivities(d); setLoading(false) })
  }, [])

  useEffect(() => {
    if (modal) setTimeout(() => inputRef.current?.focus(), 60)
  }, [modal])

  const key = (svc: string, m: number) => `${company}__${svc}__${m}`
  const get = (svc: string, m: number): Activity[] => allActivities[key(svc, m)] || []

  const saveKey = async (k: string, acts: Activity[]) => {
    setSaving(true)
    const next = { ...allActivities, [k]: acts }
    setAllActivities(next)
    await fetch('/api/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k, activities: acts }) })
    setSaving(false)
  }

  const addActivity = async () => {
    if (!modal || !form.text.trim()) return
    const k = key(modal.service, modal.month)
    await saveKey(k, [...get(modal.service, modal.month), { text: form.text.trim(), type: form.type }])
    setForm({ text: '', type: 'promo' })
    setModal(null)
  }

  const removeActivity = async (svc: string, m: number, idx: number) => {
    const acts = get(svc, m).filter((_, i) => i !== idx)
    await saveKey(key(svc, m), acts)
  }

  const typeStyle = (t: string) => ACTIVITY_TYPES.find(x => x.id === t) || ACTIVITY_TYPES[6]
  const services = SERVICES[company]
  const totalActs = services.reduce((s, svc) => s + Array.from({length:12},(_,m)=>get(svc.id,m).length).reduce((a,b)=>a+b,0), 0)

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", padding: '0 0 4rem' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #e8e4dd', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: '#faf9f6' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🍺</span>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px', color: '#1a1714' }}>Lednice Marketing</h1>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#7a7570' }}>Roční marketingový plán 2025</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving && <span style={{ fontSize: 12, color: '#9d6310', background: '#fdf6e7', padding: '3px 10px', borderRadius: 20, border: '1px solid #e8c97a' }}>Ukládám…</span>}
          {totalActs > 0 && <span style={{ fontSize: 12, color: '#555', background: '#f1efea', padding: '3px 10px', borderRadius: 20 }}>{totalActs} aktivit</span>}
        </div>
      </header>

      {/* Company tabs */}
      <div style={{ padding: '1rem 2rem 0', display: 'flex', gap: 8 }}>
        {COMPANIES.map(c => (
          <button key={c.id} onClick={() => setCompany(c.id)} style={{
            padding: '8px 18px', borderRadius: 8, border: '1.5px solid',
            borderColor: company === c.id ? '#1a1714' : '#ddd',
            background: company === c.id ? '#1a1714' : '#fff',
            color: company === c.id ? '#fff' : '#444',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s'
          }}>{c.emoji} {c.name}</button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ padding: '0.75rem 2rem', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ACTIVITY_TYPES.map(t => (
          <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: t.bg, border: `1px solid ${t.color}66`, display: 'inline-block' }}></span>
            {t.label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa' }}>Klikni na buňku → přidej aktivitu</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#aaa', fontSize: 14 }}>Načítám data…</div>
      ) : (
        <div style={{ padding: '0 2rem', overflowX: 'auto' }}>
          <div style={{ minWidth: 900 }}>
            {/* Month headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '148px repeat(12, 1fr)', gap: 2, marginBottom: 2 }}>
              <div></div>
              {MONTHS.map(m => (
                <div key={m} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888', padding: '4px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{m}</div>
              ))}
            </div>

            {/* Service rows */}
            {services.map(svc => (
              <div key={svc.id} style={{ display: 'grid', gridTemplateColumns: '148px repeat(12, 1fr)', gap: 2, marginBottom: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6px 10px 6px 0' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1714', lineHeight: 1.3 }}>{svc.name}</span>
                  <span style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{svc.sub}</span>
                </div>
                {Array.from({ length: 12 }, (_, m) => {
                  const acts = get(svc.id, m)
                  const active = svc.season[m] === 1
                  return (
                    <div key={m} onClick={() => setModal({ service: svc.id, month: m })} style={{
                      minHeight: 52, borderRadius: 5, padding: 4, cursor: 'pointer',
                      background: active ? svc.bg : '#faf9f6',
                      border: `1px solid ${active ? svc.color + '33' : '#ede9e3'}`,
                      position: 'relative', transition: 'border-color 0.1s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = svc.color + '88')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = active ? svc.color + '33' : '#ede9e3')}
                    >
                      {active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: svc.color + '66', borderRadius: '0 0 4px 4px' }}></div>}
                      {acts.map((a, i) => {
                        const ts = typeStyle(a.type)
                        return (
                          <div key={i} style={{ fontSize: 10, lineHeight: 1.25, marginBottom: 2, padding: '2px 4px', borderRadius: 3, background: ts.bg, color: ts.color, border: `0.5px solid ${ts.color}44`, wordBreak: 'break-word', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                            <span>{a.text}</span>
                            <span onClick={e => { e.stopPropagation(); removeActivity(svc.id, m, i) }} style={{ cursor: 'pointer', opacity: 0.5, flexShrink: 0, fontSize: 11, lineHeight: 1 }}>×</span>
                          </div>
                        )
                      })}
                      <div style={{ position: 'absolute', top: 2, right: 3, fontSize: 14, color: svc.color, opacity: 0.25, lineHeight: 1, pointerEvents: 'none' }}>+</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (() => {
        const svc = services.find(s => s.id === modal.service)!
        return (
          <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: '1.5rem', width: 360, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{svc.name} · {FULL_MONTHS[modal.month]}</p>
                <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 600, color: '#1a1714' }}>Přidat aktivitu</h2>
              </div>
              <input ref={inputRef} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addActivity()}
                placeholder="Popis aktivity…" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #ddd', fontFamily: 'inherit', fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #ddd', fontFamily: 'inherit', fontSize: 14, marginBottom: 16, background: '#fff', boxSizing: 'border-box' }}>
                {ACTIVITY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', color: '#666' }}>Zrušit</button>
                <button onClick={addActivity} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1a1714', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Přidat</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
