import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await kv.get('activities') as Record<string, any[]> | null
    return NextResponse.json(data || {})
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, activities } = body
    const all = (await kv.get('activities') as Record<string, any[]>) || {}
    all[key] = activities
    await kv.set('activities', all)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
