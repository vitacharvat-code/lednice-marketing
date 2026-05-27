'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MONTHS, FULL_MONTHS, COMPANIES, SERVICES, ACTIVITY_TYPES, Activity, CellPlan, PlanTask } from './data'

type SelectedCell = { service: string; month: number; table: 1 | 2 } | null

export default function Calendar() {
  const [company, setCompany] = useState('pivovar')
  const [allActivities, setAllActivities] = useState<Record<string, Activity[]>>({})
  const [allPlans, setAllPlans] = useState<Record<string, CellPlan>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<{ service: string; month: number } | null>(null)
  const [form, setForm] = useState({ text: '', type: 'prep', prepLead: 0 })
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null)
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
  }, [selectedCell?.service, selectedCell?.month, selectedCell?.table])

  const cellKey = (svc: string, m: number) => `${company}__${svc}__${m}`
  const get = (svc: string, m: number): Activity[] => allActivities[cellKey(svc, m)] || []

  const getGhosts = (svc: string, m: number): Array<{ act: Activity; targetMonth: number }> => {
    const ghosts: Array<{ act: Activity; targetMonth: number }> = []
    for (let lead = 1; lead <= 3; lead++) {
      const src = m + lead
      if (src < 12) {
        get(svc, src).forEach(a => {
          if ((a.prepLead || 0) >= lead) ghosts.push({ act: a, targetMonth: src })
        })
      }
    }
    return ghosts
  }

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
    await saveActivities(k, [...get(modal.service, modal.month), { text: form.text.trim(), type: form.type, prepLead: form.prepLead }])
    setForm({ text: '', type: 'prep', prepLead: 0 })
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

  const selectCell = (service: string, month: number, table: 1 | 2) => {
    if (selectedCell?.service === service && selectedCell?.month === month && selectedCell?.table === table) {
      setSelectedCell(null)
    } else {
      setSelectedCell({ service, month, table })
    }
  }

  const typeStyle = (t: string) => ACTIVITY_TYPES.find(x => x.id === t) || ACTIVITY_TYPES[0]
  const services = SERVICES[company]
  const totalActs = services.reduce((s, svc) => s + Array.from({ length: 12 }, (_, m) => get(svc.id, m).length).reduce((a, b) => a + b, 0), 0)
  const selectedSvc = selectedCell ? services.find(s => s.id === selectedCell.service) : null

  const GRID = '160px repeat(12, 1fr)'

  const MonthRow = ({ light }: { light?: boolean }) => (
    <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 2, marginBottom: 2 }}>
      <div />
      {MONTHS.map(m => (
        <div key={m} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: light ? '#ccc' : '#888', padding: '3px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{m}</div>
      ))}
    </div>
  )

  const SectionHeader = ({ emoji, title, sub }: { emoji: string; title: string; sub: string }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '20px 0 6px', paddingBottom: 6, borderBottom: '1px solid #e8e4dd' }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1714' }}>{title}</span>
        <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8 }}>{sub}</span>
      </div>
    </div>
  )

  const ServiceLabel = ({ svc }: { svc: typeof services[0] }) => (
    <div title={svc.note} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 10px 4px 0', cursor: svc.note ? 'help' : 'default' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1714', lineHeight: 1.3 }}>{svc.name}</span>
      <span style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{svc.sub}</span>
    </div>
  )

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", paddingBottom: selectedCell ? '300px' : '4rem' }}>

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
          klik na buňku = detail &nbsp;·&nbsp; <b style={{ color: '#888' }}>+</b> přidej aktivitu
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#aaa', fontSize: 14 }}>Načítám data…</div>
      ) : (
        <div style={{ padding: '0 2rem', overflowX: 'auto' }}>
          <div style={{ minWidth: 900 }}>

            {/* ══════════════════════════════════════ */}
            {/* TABULKA 1 — TÉMATA & CÍLE             */}
            {/* ══════════════════════════════════════ */}
            <SectionHeader emoji="🎯" title="Témata & Cíle" sub="Strategický přehled — co děláme a proč" />
            <MonthRow />

            {services.map(svc => (
              <div key={`t1-${svc.id}`} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 2, marginBottom: 2 }}>
                <ServiceLabel svc={svc} />
                {Array.from({ length: 12 }, (_, m) => {
                  const plan = allPlans[cellKey(svc.id, m)] || {}
                  const active = svc.season[m] === 1
                  const isSelected = selectedCell?.service === svc.id && selectedCell?.month === m && selectedCell?.table === 1
                  const hasContent = !!(plan.theme || plan.goal)
                  return (
                    <div
                      key={m}
                      onClick={() => selectCell(svc.id, m, 1)}
                      style={{
                        minHeight: 52, borderRadius: 5, padding: '6px 7px', cursor: 'pointer',
                        background: isSelected ? '#e3ddd4' : active ? '#eeeae2' : '#faf9f6',
                        border: `1px solid ${isSelected ? '#9d9488' : active ? '#c4bdb0' : '#ede9e3'}`,
                        transition: 'all 0.1s', position: 'relative',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#9d9488' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = isSelected ? '#9d9488' : active ? '#c4bdb0' : '#ede9e3' }}
                    >
                      {active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#b8b0a4', borderRadius: '0 0 4px 4px' }} />}
                      {hasContent ? (
                        <>
                          {plan.theme && <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1714', lineHeight: 1.3, marginBottom: 2 }}>{plan.theme}</div>}
                          {plan.goal && <div style={{ fontSize: 10, color: '#7a7570', lineHeight: 1.3 }}>{plan.goal}</div>}
                        </>
                      ) : (
                        <div style={{ fontSize: 10, color: '#ccc' }}>+ téma</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* ══════════════════════════════════════ */}
            {/* TABULKA 2 — AKTIVITY & PŘÍPRAVA       */}
            {/* ══════════════════════════════════════ */}
            <SectionHeader emoji="📋" title="Aktivity & Příprava" sub="Operační plánování — co, kdy a kdo" />
            <MonthRow />

            {services.map(svc => (
              <div key={`t2-${svc.id}`} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 2, marginBottom: 2 }}>
                <ServiceLabel svc={svc} />
                {Array.from({ length: 12 }, (_, m) => {
                  const acts = get(svc.id, m)
                  const ghosts = getGhosts(svc.id, m)
                  const active = svc.season[m] === 1
                  const isSelected = selectedCell?.service === svc.id && selectedCell?.month === m && selectedCell?.table === 2
                  const hasTasks = !!(allPlans[cellKey(svc.id, m)]?.tasks?.length)
                  return (
                    <div
                      key={m}
                      onClick={() => selectCell(svc.id, m, 2)}
                      style={{
                        minHeight: 52, borderRadius: 5, padding: 4, cursor: 'pointer',
                        background: isSelected ? '#e3ddd4' : active ? '#eeeae2' : '#faf9f6',
                        border: `1px solid ${isSelected ? '#9d9488' : active ? '#c4bdb0' : '#ede9e3'}`,
                        position: 'relative', transition: 'all 0.1s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#9d9488' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = isSelected ? '#9d9488' : active ? '#c4bdb0' : '#ede9e3' }}
                    >
                      {active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#b8b0a4', borderRadius: '0 0 4px 4px' }} />}
                      {hasTasks && <div style={{ position: 'absolute', top: 3, left: 3, width: 5, height: 5, borderRadius: '50%', background: '#9d6310' }} />}
                      {ghosts.map((g, i) => {
                        const ts = typeStyle(g.act.type)
                        return (
                          <div key={`g${i}`} title={`Příprava → ${FULL_MONTHS[g.targetMonth]}`} style={{ fontSize: 10, lineHeight: 1.25, marginBottom: 2, padding: '2px 4px', borderRadius: 3, background: '#fff', color: ts.color, border: `1px dashed ${ts.color}88`, wordBreak: 'break-word', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, opacity: 0.75 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ fontSize: 9 }}>⏳</span>
                              <span style={{ fontStyle: 'italic' }}>{g.act.text}</span>
                            </span>
                            <span style={{ fontSize: 9, opacity: 0.7, flexShrink: 0, whiteSpace: 'nowrap' }}>→ {MONTHS[g.targetMonth]}</span>
                          </div>
                        )
                      })}
                      {acts.map((a, i) => {
                        const ts = typeStyle(a.type)
                        return (
                          <div key={i} style={{ fontSize: 10, lineHeight: 1.25, marginBottom: 2, padding: '2px 4px', borderRadius: 3, background: ts.bg, color: ts.color, border: `0.5px solid ${ts.color}44`, wordBreak: 'break-word', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              {(a.prepLead || 0) > 0 && <span title={`Příprava ${a.prepLead} měs. dopředu`} style={{ fontSize: 9, opacity: 0.5 }}>●</span>}
                              <span>{a.text}</span>
                            </span>
                            <span onClick={e => { e.stopPropagation(); removeActivity(svc.id, m, i) }} style={{ cursor: 'pointer', opacity: 0.5, flexShrink: 0, fontSize: 11, lineHeight: 1 }}>×</span>
                          </div>
                        )
                      })}
                      <div
                        onClick={e => { e.stopPropagation(); setModal({ service: svc.id, month: m }); setForm({ text: '', type: 'prep', prepLead: 0 }) }}
                        title="Přidat aktivitu"
                        style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 13, color: '#bbb', lineHeight: 1, cursor: 'pointer', padding: '1px 3px', borderRadius: 3, transition: 'color 0.1s', fontWeight: 600 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#1a1714')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
                      >+</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal pro přidání aktivity */}
      {modal && (() => {
        const svc = services.find(s => s.id === modal.service)!
        return (
          <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: '1.5rem', width: 380, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{svc.name} · {FULL_MONTHS[modal.month]}</p>
                <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 600, color: '#1a1714' }}>Přidat aktivitu</h2>
              </div>
              <input ref={inputRef} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addActivity()}
                placeholder="Popis aktivity…" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #ddd', fontFamily: 'inherit', fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #ddd', fontFamily: 'inherit', fontSize: 14, marginBottom: 10, background: '#fff', boxSizing: 'border-box' }}>
                {ACTIVITY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>⏳ Zahájit přípravu</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2, 3].map(n => {
                    const prepMonth = modal.month - n
                    const label = n === 0 ? 'Bez přípravy' : `${n} měs.${prepMonth >= 0 ? ` (${MONTHS[prepMonth]})` : ''}`
                    return (
                      <button key={n} onClick={() => setForm(f => ({ ...f, prepLead: n }))} style={{
                        flex: 1, padding: '6px 4px', borderRadius: 7, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
                        border: `1.5px solid ${form.prepLead === n ? '#1a1714' : '#ddd'}`,
                        background: form.prepLead === n ? '#1a1714' : '#fff',
                        color: form.prepLead === n ? '#fff' : '#666', transition: 'all 0.1s',
                      }}>{label}</button>
                    )
                  })}
                </div>
                {form.prepLead > 0 && modal.month - form.prepLead >= 0 && (
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9d6310' }}>
                    ⏳ Ghost chip v: <b>{Array.from({ length: form.prepLead }, (_, i) => FULL_MONTHS[modal.month - form.prepLead + i]).join(', ')}</b>
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', color: '#666' }}>Zrušit</button>
                <button onClick={addActivity} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1a1714', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Přidat</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Spodní detail panel */}
      {selectedCell && selectedSvc && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '2px solid #e8e4dd', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)', zIndex: 50, height: 280, display: 'flex', flexDirection: 'column' }}>
          {/* Header panelu */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', borderBottom: '1px solid #f0ece6', flexShrink: 0, gap: 10 }}>
            <span style={{ fontSize: 11, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {selectedCell.table === 1 ? '🎯 Téma' : '📋 Aktivity'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {selectedSvc.name} · {FULL_MONTHS[selectedCell.month]}
            </span>
            <button onClick={() => setSelectedCell(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>

          {/* Tělo panelu — Tabulka 1: Téma & Cíl */}
          {selectedCell.table === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderRight: '1px solid #f0ece6', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>🏷️ Téma měsíce</label>
                  <input
                    autoFocus
                    value={planDraft.theme || ''}
                    onChange={e => updatePlan({ theme: e.target.value })}
                    placeholder="Např. Turisté, Firemní akce, Silvestr…"
                    style={{ ...inputStyle, fontSize: 14, fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>🎯 Cíl / KPI</label>
                  <input
                    value={planDraft.goal || ''}
                    onChange={e => updatePlan({ goal: e.target.value })}
                    placeholder="Co chceme dosáhnout?"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>📋 Popis & strategie</label>
                <textarea
                  value={planDraft.description || ''}
                  onChange={e => updatePlan({ description: e.target.value })}
                  placeholder="Na koho cílíme? Jak to budeme komunikovat?"
                  style={{ ...inputStyle, resize: 'none', flex: 1, minHeight: 80 }}
                />
              </div>
            </div>
          )}

          {/* Tělo panelu — Tabulka 2: Úkoly */}
          {selectedCell.table === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', flex: 1, overflow: 'hidden' }}>
              {/* Levý sloupec: odkaz na téma + poznámky */}
              <div style={{ padding: '12px 16px', borderRight: '1px solid #f0ece6', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allPlans[cellKey(selectedCell.service, selectedCell.month)]?.theme && (
                  <div style={{ padding: '7px 10px', background: '#f5f0e8', borderRadius: 6, borderLeft: '3px solid #c4bdb0' }}>
                    <div style={{ fontSize: 9, color: '#9d6310', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Téma</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1714' }}>{allPlans[cellKey(selectedCell.service, selectedCell.month)]?.theme}</div>
                    {allPlans[cellKey(selectedCell.service, selectedCell.month)]?.goal && (
                      <div style={{ fontSize: 11, color: '#7a7570', marginTop: 2 }}>{allPlans[cellKey(selectedCell.service, selectedCell.month)]?.goal}</div>
                    )}
                  </div>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>📝 Poznámky</label>
                  <textarea
                    value={planDraft.description || ''}
                    onChange={e => updatePlan({ description: e.target.value })}
                    placeholder="Poznámky k aktivitám a přípravě…"
                    style={{ ...inputStyle, resize: 'none', flex: 1, minHeight: 60 }}
                  />
                </div>
              </div>
              {/* Pravý sloupec: Úkoly */}
              <div style={{ padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>✅ Úkoly</label>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    <input ref={taskInputRef} value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Nový úkol…" style={{ ...inputStyle, width: 220 }} />
                    <button onClick={addTask} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#1a1714', color: '#fff', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>+</button>
                  </div>
                </div>
                {(planDraft.tasks || []).length === 0 && <p style={{ fontSize: 12, color: '#ccc', margin: '8px 0 0' }}>Zatím žádné úkoly.</p>}
                {(planDraft.tasks || []).map((task, i) => (
                  <div key={i} style={{ borderRadius: 8, border: `1px solid ${expandedTask === i ? '#c4bdb0' : '#ede9e3'}`, background: expandedTask === i ? '#faf9f6' : '#fff', overflow: 'hidden', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px' }}>
                      <input type="checkbox" checked={task.done} onChange={() => toggleTask(i)} style={{ cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: task.done ? '#aaa' : '#1a1714', textDecoration: task.done ? 'line-through' : 'none', flex: 1 }}>{task.text}</span>
                      {task.responsibility && <span style={{ fontSize: 10, color: '#8a2f56', background: '#fdf0f5', padding: '1px 6px', borderRadius: 10 }}>👤 {task.responsibility}</span>}
                      {task.deadline && <span style={{ fontSize: 10, color: '#9d6310', background: '#fdf6e7', padding: '1px 6px', borderRadius: 10 }}>📅 {task.deadline}</span>}
                      <span onClick={() => setExpandedTask(expandedTask === i ? null : i)} style={{ fontSize: 11, color: '#aaa', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: '#f4f4f2', userSelect: 'none' }}>{expandedTask === i ? '▲' : '▼'}</span>
                      <span onClick={() => removeTask(i)} style={{ fontSize: 15, color: '#ccc', cursor: 'pointer', lineHeight: 1 }}>×</span>
                    </div>
                    {expandedTask === i && (
                      <div style={{ padding: '0 10px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8, borderTop: '1px solid #f0ece6' }}>
                        <div style={{ paddingTop: 8 }}>
                          <label style={labelStyle}>👤 Zodpovědnost</label>
                          <input value={task.responsibility || ''} onChange={e => updateTask(i, { responsibility: e.target.value })} placeholder="Kdo?" style={inputStyle} />
                        </div>
                        <div style={{ paddingTop: 8 }}>
                          <label style={labelStyle}>📅 Termín</label>
                          <input value={task.deadline || ''} onChange={e => updateTask(i, { deadline: e.target.value })} placeholder="Do kdy?" style={inputStyle} />
                        </div>
                        <div style={{ paddingTop: 8 }}>
                          <label style={labelStyle}>💬 Poznámky</label>
                          <input value={task.notes || ''} onChange={e => updateTask(i, { notes: e.target.value })} placeholder="Volná poznámka…" style={inputStyle} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
