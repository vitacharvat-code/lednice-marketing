'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MONTHS, FULL_MONTHS, COMPANIES, SERVICES, ACTIVITY_TYPES, Activity, CellPlan, PlanTask } from './data'

export default function Calendar() {
  const [company, setCompany] = useState('pivovar')
  const [allActivities, setAllActivities] = useState<Record<string, Activity[]>>({})
  const [allPlans, setAllPlans] = useState<Record<string, CellPlan>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<{ service: string; month: number } | null>(null)
  const [form, setForm] = useState({ text: '', type: 'prep' })
  const [selectedCell, setSelectedCell] = useState<{ service: string; month: number } | null>(null)
  const [planDraft, setPlanDraft] = useState<CellPlan>({})
  const [newTask, setNewTask] = useState('')
  const [expandedTask, setExpandedTask] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const taskInputRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/activities').then(r => r.json()).then(d => {
      setAllActivities(d.activities || {})
      setAllPlans(d.plans || {})
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (modal) setTimeout(() => inputRef.current?.focus(), 60)
  }, [modal])

  useEffect(() => {
    if (selectedCell) {
      const k = cellKey(selectedCell.service, selectedCell.month)
      setPlanDraft(allPlans[k] || {})
      setNewTask('')
      setExpandedTask(null)
    }
  }, [selectedCell?.service, selectedCell?.month])

  const cellKey = (svc: string, m: number) => `${company}__${svc}__${m}`
  const get = (svc: string, m: number): Activity[] => allActivities[cellKey(svc, m)] || []

  const saveActivities = async (k: string, acts: Activity[]) => {
    setSaving(true)
    setAllActivities(prev => ({ ...prev, [k]: acts }))
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'activity', key: k, activities: acts }),
    })
    setSaving(false)
  }

  const debouncedSavePlan = useCallback((k: string, plan: CellPlan) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      setAllPlans(prev => ({ ...prev, [k]: plan }))
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'plan', key: k, plan }),
      })
      setSaving(false)
    }, 800)
  }, [])

  const updatePlan = (patch: Partial<CellPlan>) => {
    if (!selectedCell) return
    const next = { ...planDraft, ...patch }
    setPlanDraft(next)
    debouncedSavePlan(cellKey(selectedCell.service, selectedCell.month), next)
  }

  const addActivity = async () => {
    if (!modal || !form.text.trim()) return
    const k = cellKey(modal.service, modal.month)
    await saveActivities(k, [...get(modal.service, modal.month), { text: form.text.trim(), type: form.type }])
    setForm({ text: '', type: 'prep' })
    setModal(null)
  }

  const removeActivity = async (svc: string, m: number, idx: number) => {
    await saveActivities(cellKey(svc, m), get(svc, m).filter((_, i) => i !== idx))
  }

  const addTask = () => {
    if (!newTask.trim()) return
    const tasks = [...(planDraft.tasks || []), { text: newTask.trim(), done: false }]
    updatePlan({ tasks })
    setExpandedTask(tasks.length - 1)
    setNewTask('')
    setTimeout(() => taskInputRef.current?.focus(), 30)
  }

  const toggleTask = (idx: number) => {
    const tasks = (planDraft.tasks || []).map((t, i) => i === idx ? { ...t, done: !t.done } : t)
    updatePlan({ tasks })
  }

  const updateTask = (idx: number, patch: Partial<PlanTask>) => {
    const tasks = (planDraft.tasks || []).map((t, i) => i === idx ? { ...t, ...patch } : t)
    updatePlan({ tasks })
  }

  const removeTask = (idx: number) => {
    const tasks = (planDraft.tasks || []).filter((_, i) => i !== idx)
    if (expandedTask === idx) setExpandedTask(null)
    else if (expandedTask !== null && expandedTask > idx) setExpandedTask(expandedTask - 1)
    updatePlan({ tasks })
  }

  const typeStyle = (t: string) => ACTIVITY_TYPES.find(x => x.id === t) || ACTIVITY_TYPES[0]
  const services = SERVICES[company]
  const totalActs = services.reduce((s, svc) => s + Array.from({ length: 12 }, (_, m) => get(svc.id, m).length).reduce((a, b) => a + b, 0), 0)
  const selectedSvc = selectedCell ? services.find(s => s.id === selectedCell.service) : null

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", paddingBottom: selectedCell ? '340px' : '4rem' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #e8e4dd', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: '#faf9f6' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🍺</span>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px', color: '#1a1714' }}>Lednice Marketing</h1>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#7a7570' }}>Roční marketingový plán</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving && <span style={{ fontSize: 12, color: '#9d6310', background: '#fdf6e7', padding: '3px 10px', borderRadius: 20, border: '1px solid #e8c97a' }}>Ukládám…</span>}
          {totalActs > 0 && <span style={{ fontSize: 12, color: '#555', background: '#f1efea', padding: '3px 10px', borderRadius: 20 }}>{totalActs} aktivit</span>}
        </div>
      </header>

      {/* Company tabs */}
      <div style={{ padding: '1rem 2rem 0', display: 'flex', gap: 8 }}>
        {COMPANIES.map(c => (
          <button key={c.id} onClick={() => { setCompany(c.id); setSelectedCell(null) }} style={{
            padding: '8px 18px', borderRadius: 8, border: '1.5px solid',
            borderColor: company === c.id ? '#1a1714' : '#ddd',
            background: company === c.id ? '#1a1714' : '#fff',
            color: company === c.id ? '#fff' : '#444',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
          }}>{c.emoji} {c.name}</button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ padding: '0.75rem 2rem', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {ACTIVITY_TYPES.map(t => (
          <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: t.bg, border: `1px solid ${t.color}66`, display: 'inline-block' }}></span>
            {t.label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa' }}>
          <b style={{ color: '#888' }}>+</b> přidej aktivitu &nbsp;·&nbsp; klik na buňku = detail plánu
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#aaa', fontSize: 14 }}>Načítám data…</div>
      ) : (
        <div style={{ padding: '0 2rem', overflowX: 'auto' }}>
          <div style={{ minWidth: 900 }}>
            {/* Month headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(12, 1fr)', gap: 2, marginBottom: 2 }}>
              <div></div>
              {MONTHS.map(m => (
                <div key={m} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#888', padding: '4px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{m}</div>
              ))}
            </div>

            {/* Service rows */}
            {services.map(svc => (
              <div key={svc.id} style={{ display: 'grid', gridTemplateColumns: '160px repeat(12, 1fr)', gap: 2, marginBottom: 2 }}>
                <div
                  title={svc.note}
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6px 10px 6px 0', cursor: svc.note ? 'help' : 'default' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1714', lineHeight: 1.3 }}>{svc.name}</span>
                  <span style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{svc.sub}</span>
                </div>
                {Array.from({ length: 12 }, (_, m) => {
                  const acts = get(svc.id, m)
                  const active = svc.season[m] === 1
                  const isSelected = selectedCell?.service === svc.id && selectedCell?.month === m
                  const hasPlan = !!(allPlans[cellKey(svc.id, m)] && Object.values(allPlans[cellKey(svc.id, m)]).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== '')))
                  return (
                    <div
                      key={m}
                      onClick={() => setSelectedCell(isSelected ? null : { service: svc.id, month: m })}
                      style={{
                        minHeight: 52, borderRadius: 5, padding: 4, cursor: 'pointer',
                        background: isSelected ? '#e3ddd4' : active ? '#eeeae2' : '#faf9f6',
                        border: `1px solid ${isSelected ? '#9d9488' : active ? '#c4bdb0' : '#ede9e3'}`,
                        position: 'relative', transition: 'all 0.1s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#9d9488' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = isSelected ? '#9d9488' : active ? '#c4bdb0' : '#ede9e3' }}
                    >
                      {active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#b8b0a4', borderRadius: '0 0 4px 4px' }}></div>}
                      {hasPlan && <div style={{ position: 'absolute', top: 3, left: 3, width: 5, height: 5, borderRadius: '50%', background: '#9d6310' }}></div>}
                      {acts.map((a, i) => {
                        const ts = typeStyle(a.type)
                        return (
                          <div key={i} style={{ fontSize: 10, lineHeight: 1.25, marginBottom: 2, padding: '2px 4px', borderRadius: 3, background: ts.bg, color: ts.color, border: `0.5px solid ${ts.color}44`, wordBreak: 'break-word', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                            <span>{a.text}</span>
                            <span onClick={e => { e.stopPropagation(); removeActivity(svc.id, m, i) }} style={{ cursor: 'pointer', opacity: 0.5, flexShrink: 0, fontSize: 11, lineHeight: 1 }}>×</span>
                          </div>
                        )
                      })}
                      {/* + button */}
                      <div
                        onClick={e => { e.stopPropagation(); setModal({ service: svc.id, month: m }); setForm({ text: '', type: 'prep' }) }}
                        title="Přidat aktivitu"
                        style={{
                          position: 'absolute', top: 2, right: 3, fontSize: 14, color: '#999',
                          lineHeight: 1, cursor: 'pointer', padding: '0 2px',
                          borderRadius: 3, transition: 'color 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1a1714')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#999')}
                      >+</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add activity modal */}
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

      {/* Bottom detail panel */}
      {selectedCell && selectedSvc && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '2px solid #e8e4dd',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          zIndex: 50, height: 340, display: 'flex', flexDirection: 'column',
        }}>
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 24px', borderBottom: '1px solid #f0ece6', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {selectedSvc.name} · {FULL_MONTHS[selectedCell.month]}
            </span>
            <button onClick={() => setSelectedCell(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>

          {/* Panel body: 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', flex: 1, overflow: 'hidden' }}>

            {/* Col 1: Cíl + Popis */}
            <div style={{ padding: '12px 16px', borderRight: '1px solid #f0ece6', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle}>🎯 Cíl / KPI</label>
                <input
                  value={planDraft.goal || ''}
                  onChange={e => updatePlan({ goal: e.target.value })}
                  placeholder="Co chceme dosáhnout?"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>📋 Popis & strategie</label>
                <textarea
                  value={planDraft.description || ''}
                  onChange={e => updatePlan({ description: e.target.value })}
                  placeholder="Co a jak budeme komunikovat?"
                  style={{ ...inputStyle, resize: 'none', flex: 1, minHeight: 80 }}
                />
              </div>
            </div>

            {/* Col 2: Úkoly s detailem */}
            <div style={{ padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>✅ Úkoly</label>
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  <input
                    ref={taskInputRef}
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTask()}
                    placeholder="Nový úkol…"
                    style={{ ...inputStyle, width: 220 }}
                  />
                  <button onClick={addTask} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#1a1714', color: '#fff', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>+</button>
                </div>
              </div>

              {(planDraft.tasks || []).length === 0 && (
                <p style={{ fontSize: 12, color: '#ccc', margin: '8px 0 0' }}>Zatím žádné úkoly. Přidej první výše.</p>
              )}

              {(planDraft.tasks || []).map((task, i) => (
                <div key={i} style={{ borderRadius: 8, border: `1px solid ${expandedTask === i ? '#c4bdb0' : '#ede9e3'}`, background: expandedTask === i ? '#faf9f6' : '#fff', overflow: 'hidden', transition: 'all 0.15s' }}>
                  {/* Task row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px' }}>
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(i)} style={{ cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: task.done ? '#aaa' : '#1a1714', textDecoration: task.done ? 'line-through' : 'none', flex: 1 }}>{task.text}</span>
                    {/* detail badges */}
                    {task.responsibility && <span style={{ fontSize: 10, color: '#8a2f56', background: '#fdf0f5', padding: '1px 6px', borderRadius: 10 }}>👤 {task.responsibility}</span>}
                    {task.deadline && <span style={{ fontSize: 10, color: '#9d6310', background: '#fdf6e7', padding: '1px 6px', borderRadius: 10 }}>📅 {task.deadline}</span>}
                    <span
                      onClick={() => setExpandedTask(expandedTask === i ? null : i)}
                      style={{ fontSize: 11, color: '#aaa', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: '#f4f4f2', userSelect: 'none' }}
                    >{expandedTask === i ? '▲' : '▼'}</span>
                    <span onClick={() => removeTask(i)} style={{ fontSize: 15, color: '#ccc', cursor: 'pointer', lineHeight: 1 }}>×</span>
                  </div>
                  {/* Expandable detail */}
                  {expandedTask === i && (
                    <div style={{ padding: '0 10px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8, borderTop: '1px solid #f0ece6' }}>
                      <div style={{ paddingTop: 8 }}>
                        <label style={labelStyle}>👤 Zodpovědnost</label>
                        <input
                          value={task.responsibility || ''}
                          onChange={e => updateTask(i, { responsibility: e.target.value })}
                          placeholder="Kdo?"
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ paddingTop: 8 }}>
                        <label style={labelStyle}>📅 Termín</label>
                        <input
                          value={task.deadline || ''}
                          onChange={e => updateTask(i, { deadline: e.target.value })}
                          placeholder="Do kdy?"
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ paddingTop: 8 }}>
                        <label style={labelStyle}>💬 Poznámky</label>
                        <input
                          value={task.notes || ''}
                          onChange={e => updateTask(i, { notes: e.target.value })}
                          placeholder="Volná poznámka…"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, color: '#999',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 7,
  border: '1.5px solid #e8e4dd', fontFamily: 'inherit', fontSize: 13,
  background: '#faf9f6', outline: 'none', boxSizing: 'border-box',
  color: '#1a1714', marginBottom: 0,
}
