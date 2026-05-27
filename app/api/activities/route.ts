import { put, list } from '@vercel/blob'
import { NextResponse } from 'next/server'

interface Store {
  activities: Record<string, any[]>
  plans: Record<string, any>
}

async function loadStore(): Promise<Store> {
  try {
    const { blobs } = await list({ prefix: 'activities.json' })
    if (blobs.length === 0) return { activities: {}, plans: {} }
    const res = await fetch(blobs[0].url)
    const data = await res.json()
    // backward compat: old format was flat Record<string, Activity[]>
    if (data.activities || data.plans) return { activities: data.activities || {}, plans: data.plans || {} }
    return { activities: data, plans: {} }
  } catch {
    return { activities: {}, plans: {} }
  }
}

async function saveStore(store: Store) {
  await put('activities.json', JSON.stringify(store), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
}

export async function GET() {
  try {
    return NextResponse.json(await loadStore())
  } catch {
    return NextResponse.json({ activities: {}, plans: {} })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const store = await loadStore()

    if (body.type === 'plan') {
      store.plans[body.key] = body.plan
    } else {
      // activity (default, also handles legacy requests)
      const key = body.key
      const activities = body.activities
      store.activities[key] = activities
    }

    await saveStore(store)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
