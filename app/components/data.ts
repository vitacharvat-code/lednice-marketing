export const MONTHS = ['Led','Ún','Bře','Dub','Kvě','Čer','Čvc','Srp','Zář','Říj','Lis','Pro']
export const FULL_MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec']

export const COMPANIES = [
  { id: 'pivovar', name: 'Pivovar Lednice', emoji: '🍺' },
  { id: 'resort',  name: 'Resort Lednice',  emoji: '🏨' },
]

export interface Service {
  id: string
  name: string
  sub: string
  color: string
  bg: string
  season: number[]
}

export const SERVICES: Record<string, Service[]> = {
  pivovar: [
    { id: 'restaurace', name: 'Restaurace',       sub: 'stálý provoz',          color: '#b04a24', bg: '#fdf1ed', season: [1,1,1,1,1,1,1,1,1,1,1,1] },
    { id: 'firemni',    name: 'Firemní akce',      sub: 'oslavy & teambuilding', color: '#8a2f56', bg: '#fdf0f5', season: [0,0,1,1,1,1,0,0,1,1,1,0] },
    { id: 'catering',   name: 'Catering',           sub: 'venkovní & soukromé',   color: '#9d6310', bg: '#fdf6e7', season: [0,0,0,1,1,1,1,1,1,1,0,0] },
    { id: 'festivaly',  name: 'Festivaly & akce',   sub: 'gastro & pivní',        color: '#33600f', bg: '#f2f8ea', season: [0,0,0,1,1,1,1,1,1,0,0,0] },
    { id: 'eshop',      name: 'E-shop & rozvoz',    sub: 'pivo & merch',          color: '#15528f', bg: '#eaf3fc', season: [1,1,1,1,1,1,1,1,1,1,1,1] },
  ],
  resort: [
    { id: 'ubytovani',    name: 'Ubytování',        sub: 'celoroční',             color: '#4a3fa3', bg: '#efeefd', season: [1,1,1,1,1,1,1,1,1,1,1,1] },
    { id: 'wellness',     name: 'Wellness',          sub: 'procedury & relaxace',  color: '#0d6048', bg: '#e4f6f0', season: [1,1,1,1,0,0,0,0,1,1,1,1] },
    { id: 'pivni_lazne',  name: 'Pivní lázně',       sub: 'pivní kúry',            color: '#b04a24', bg: '#fdf1ed', season: [1,1,1,1,0,0,0,0,1,1,1,1] },
    { id: 'balicky',      name: 'Balíčky pobytové',  sub: 'romantika, víkendy',    color: '#8a2f56', bg: '#fdf0f5', season: [0,0,1,1,1,0,0,1,1,1,1,0] },
    { id: 'vouchers',     name: 'Dárkové poukazy',   sub: 'vouchery & dárky',      color: '#15528f', bg: '#eaf3fc', season: [1,1,0,0,0,0,0,0,0,0,1,1] },
  ],
}

export const ACTIVITY_TYPES = [
  { id: 'promo',  label: 'Promo / kampaň',      color: '#15528f', bg: '#eaf3fc' },
  { id: 'event',  label: 'Akce / event',         color: '#33600f', bg: '#f2f8ea' },
  { id: 'social', label: 'Social media',         color: '#4a3fa3', bg: '#efeefd' },
  { id: 'email',  label: 'E-mail / newsletter',  color: '#9d6310', bg: '#fdf6e7' },
  { id: 'ppc',    label: 'PPC / reklama',        color: '#b04a24', bg: '#fdf1ed' },
  { id: 'pr',     label: 'PR / tisk',            color: '#8a2f56', bg: '#fdf0f5' },
  { id: 'other',  label: 'Ostatní',              color: '#555',    bg: '#f4f4f2' },
]

export interface Activity {
  text: string
  type: string
}
