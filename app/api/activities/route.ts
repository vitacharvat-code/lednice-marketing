import { put, head, getDownloadUrl } from '@vercel/blob'
import { NextResponse } from 'next/server'

const BLOB_KEY = 'activities.json'

async function loadActivities(): Promise<Record<string, any[]>> {
  try {
    const blob = await head(BLOB_KEY)
    const res = await fetch(blob.url)
    return await res.json()
  } catch {
    return {}
  }
}

export async function GET() {
  try {
    const data = await loadActivities()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, activities } = body
    const all = await loadActivities()
    all[key] = activities
    await put(BLOB_KEY, JSON.stringify(all), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
