import { put, list } from '@vercel/blob'
import { NextResponse } from 'next/server'

async function loadActivities(): Promise<Record<string, any[]>> {
  const { blobs } = await list({ prefix: 'activities.json' })
  if (blobs.length === 0) return {}
  const res = await fetch(blobs[0].url)
  return res.json()
}

export async function GET() {
  try {
    return NextResponse.json(await loadActivities())
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(request: Request) {
  try {
    const { key, activities } = await request.json()
    const all = await loadActivities()
    all[key] = activities
    await put('activities.json', JSON.stringify(all), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
