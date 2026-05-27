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
  season: number[]  // 0 = mimo sezonu, 1 = aktivní sezona
  note?: string     // kontextová poznámka k sezoně
}

// Indexy měsíců: 0=Led, 1=Ún, 2=Bře, 3=Dub, 4=Kvě, 5=Čer, 6=Čvc, 7=Srp, 8=Zář, 9=Říj, 10=Lis, 11=Pro

export const SERVICES: Record<string, Service[]> = {
  pivovar: [
    {
      id: 'kampane',
      name: '📅 Příprava kampaní',
      sub: 'lead time · podklady · spuštění',
      color: '#5c3d99',
      bg: '#f0ebff',
      // Kampaně musí startovat 6–8 týdnů před vrcholem → příprava již od ledna
      season: [1,1,1,1,1,1,1,1,1,1,1,1],
      note: 'Každou kampaň startuj 6–8 týdnů před cílovou sezonou. Firemní jaro → spusť v únoru. Turistické léto → spusť v dubnu. Vánoční večírky → spusť v září.',
    },
    {
      id: 'restaurace',
      name: 'Restaurace & bar',
      sub: 'stálý provoz · celoroční',
      color: '#b04a24',
      bg: '#fdf1ed',
      // Provoz celoroční, marketing slabší v nejslabší zimě
      season: [0,0,1,1,1,1,1,1,1,1,1,1],
      note: 'Leden–únor nejslabší. Od března promo na zahájení sezony. Léto a vánoce jsou vrcholy.',
    },
    {
      id: 'firemni',
      name: 'Firemní akce & teambuilding',
      sub: 'únor–červen · září–listopad · st–pá',
      color: '#8a2f56',
      bg: '#fdf0f5',
      // Firemní sezona: jaro duben-červen + podzim září-listopad, příprava od února resp. července
      season: [0,1,1,1,1,1,0,0,1,1,1,0],
      note: 'Hlavní dny: středa–pátek. Po a út slabší → vhodné pro lokální akce. Jarní sezona: kampaně spouštět v únoru–březnu. Podzimní sezona: kampaně spouštět v červenci.',
    },
    {
      id: 'turisticka',
      name: 'Turistická sezona',
      sub: 'duben–říjen · vrchol červenec–srpen',
      color: '#33600f',
      bg: '#f2f8ea',
      // Turisté od dubna, vrchol léto, konec říjen (Sv. Martin)
      season: [0,0,0,1,1,1,1,1,1,1,0,0],
      note: 'Duben–červen: víkendy. Červenec–srpen: celý týden plno (Lednice plná turistů). Září–říjen: víkendy, závisí na počasí. Kampně na léto spustit v dubnu.',
    },
    {
      id: 'festivaly',
      name: 'Festivaly & akce',
      sub: 'pivní · gastro · hudební',
      color: '#0d6048',
      bg: '#e4f6f0',
      // Festivaly duben-září, vrchol léto
      season: [0,0,0,1,1,1,1,1,1,0,0,0],
      note: 'Jezdíme nejrůznější pivní, gastro a hudební festivaly. Léto = červenec a srpen. Pondělí–středa bývají slabší dny.',
    },
    {
      id: 'lokalni',
      name: 'Lokální program',
      sub: 'studenti · po–út · mimo špičku',
      color: '#9d6310',
      bg: '#fdf6e7',
      // Program pro místní a studenty – pondělí a úterý v jarní a podzimní sezoně
      season: [0,0,0,1,1,1,0,0,1,1,0,0],
      note: 'Pondělí a úterý jsou slabé dny → speciální program pro místní a studenty (quiz nighty, ochutnávky, akce s Mendelkou apod.).',
    },
    {
      id: 'vanocni',
      name: 'Vánoční večírky & Silvestr',
      sub: 'listopad–prosinec · B2B',
      color: '#b83232',
      bg: '#fdf0f0',
      // Firemní vánoční večírky nov-dec, vrchol Silvestr
      season: [0,0,0,0,0,0,0,0,0,0,1,1],
      note: 'Firemní vánoční večírky od listopadu, Silvestr jako vrchol. Rezervace se plní brzy – kampaně spustit v září.',
    },
    {
      id: 'zimni_balicky',
      name: 'Zimní balíčky',
      sub: 'leden–únor · resort + pivovar',
      color: '#15528f',
      bg: '#eaf3fc',
      // Speciální zimní balíčky propojující pivovar a resort v nejslabší sezoně
      season: [1,1,1,0,0,0,0,0,0,0,0,1],
      note: 'Nejslabší sezona. Speciální balíčky propojující pivovarní zážitky s wellness a pivními lázněmi resortu. Kampaně startovat v listopadu–prosinci.',
    },
    {
      id: 'eshop',
      name: 'E-shop & rozvoz',
      sub: 'pivo · merch · dárkové sady',
      color: '#2a7a5a',
      bg: '#e8f7f1',
      // E-shop celoroční, důraz na vánoce a zimu
      season: [1,1,1,1,1,1,1,1,1,1,1,1],
      note: 'Celoroční, ale vánoce (říjen–prosinec) jsou vrcholem pro dárkové sady. Zima je příležitost pro rozvoz do restaurací.',
    },
  ],

  resort: [
    {
      id: 'kampane_resort',
      name: '📅 Příprava kampaní',
      sub: 'lead time · podklady · spuštění',
      color: '#5c3d99',
      bg: '#f0ebff',
      season: [1,1,1,1,1,1,1,1,1,1,1,1],
      note: 'Kampně na letní ubytování spouštět v březnu–dubnu. Zimní balíčky v říjnu–listopadu. Valentýnské balíčky v prosinci.',
    },
    {
      id: 'ubytovani',
      name: 'Ubytování',
      sub: 'celoroční · hlavní sezóna léto',
      color: '#4a3fa3',
      bg: '#efeefd',
      season: [1,1,1,1,1,1,1,1,1,1,1,1],
      note: 'Celoroční. Léto (čvc–srp) a vánoce jsou vrcholy. Zima je nejslabší – ideální pro speciální balíčky.',
    },
    {
      id: 'wellness',
      name: 'Wellness & procedury',
      sub: 'relaxace · mimo turistickou sezonu',
      color: '#0d6048',
      bg: '#e4f6f0',
      // Wellness táhne v zimě a přechodném období, v létě hosté preferují outdor
      season: [1,1,1,1,0,0,0,0,1,1,1,1],
      note: 'Silnější v zimě a přechodném období. V létě hosté preferují outdoor – wellness jako doplněk.',
    },
    {
      id: 'pivni_lazne',
      name: 'Pivní lázně',
      sub: 'pivní kúry · unikátní zážitek',
      color: '#b04a24',
      bg: '#fdf1ed',
      season: [1,1,1,1,0,0,0,0,1,1,1,1],
      note: 'Unikátní produkt vhodný jako dárek nebo součást zimních balíčků. Kombinovat s pivovarem = silný produkt.',
    },
    {
      id: 'balicky',
      name: 'Pobytové balíčky',
      sub: 'romantika · víkendy · zážitky',
      color: '#8a2f56',
      bg: '#fdf0f5',
      season: [0,1,1,1,1,1,1,1,1,1,1,0],
      note: 'Valentýn v únoru, romantické víkendy jaro–podzim. Zimní balíčky s pivovarem (led–únor) jako speciální produkt.',
    },
    {
      id: 'vouchers',
      name: 'Dárkové poukazy',
      sub: 'vouchery · Vánoce · Valentýn',
      color: '#15528f',
      bg: '#eaf3fc',
      season: [1,1,0,0,0,0,0,0,0,0,1,1],
      note: 'Vánoce (říjen–prosinec) a Valentýn (leden). Připravit kampaň v září pro vánoce, v prosinci pro Valentýn.',
    },
  ],
}

export const ACTIVITY_TYPES = [
  { id: 'prep',    label: '📅 Příprava kampaně',  color: '#5c3d99', bg: '#f0ebff' },
  { id: 'promo',   label: 'Promo / kampaň',        color: '#15528f', bg: '#eaf3fc' },
  { id: 'event',   label: 'Akce / event',           color: '#33600f', bg: '#f2f8ea' },
  { id: 'social',  label: 'Social media',           color: '#4a3fa3', bg: '#efeefd' },
  { id: 'email',   label: 'E-mail / newsletter',   color: '#9d6310', bg: '#fdf6e7' },
  { id: 'ppc',     label: 'PPC / reklama',          color: '#b04a24', bg: '#fdf1ed' },
  { id: 'pr',      label: 'PR / tisk',              color: '#8a2f56', bg: '#fdf0f5' },
  { id: 'other',   label: 'Ostatní',                color: '#555',    bg: '#f4f4f2' },
]

export interface Activity {
  text: string
  type: string
}

export interface PlanTask {
  text: string
  done: boolean
}

export interface CellPlan {
  goal?: string            // Cíl / KPI
  description?: string     // Popis / strategie
  tasks?: PlanTask[]       // Úkoly (checklist)
  responsibilities?: string // Zodpovědnosti
  deadline?: string        // Termín přípravy
  notes?: string           // Poznámky
  budget?: string          // Rozpočet
}
