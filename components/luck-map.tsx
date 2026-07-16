'use client'

import { useMemo, useState, useTransition } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import { MapPin, Clover } from 'lucide-react'
import { PROVINCES, provinceName } from '@/lib/provinces'
import { addLuck as addLuckAction } from '@/app/actions/map'

const GEO_URL =
  'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/canada.geojson'

export function LuckMap({ initialCounts }: { initialCounts: Record<string, number> }) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts)
  const [selected, setSelected] = useState<string>('')
  const [hovered, setHovered] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const [isPending, startTransition] = useTransition()

  const max = useMemo(() => Math.max(...Object.values(counts)), [counts])
  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts],
  )

  const colorScale = useMemo(
    () => scaleLinear<string>().domain([0, max]).range(['#f4d9dc', '#c8102e']),
    [max],
  )

  const ranked = useMemo(
    () =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], i) => ({ name, count, rank: i + 1 })),
    [counts],
  )

  function addLuck() {
    if (!selected || isPending) return
    const code = selected
    const name = provinceName(code)
    startTransition(async () => {
      try {
        const newCount = await addLuckAction(code)
        setCounts((prev) => ({ ...prev, [name]: newCount }))
        setJustAdded(true)
      } catch {
        // Optimistic fallback so the map still feels responsive.
        setCounts((prev) => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }))
      }
    })
  }

  const activeName = hovered ?? (selected ? provinceName(selected) : null)

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" aria-hidden="true" />
            <span className="font-display font-bold">Luck across Canada</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {total.toLocaleString()} lucky picks
          </span>
        </div>
        <div className="relative">
          <ComposableMap
            projection="geoAzimuthalEqualArea"
            projectionConfig={{ rotate: [95, -63, 0], scale: 700 }}
            width={800}
            height={600}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name: string = geo.properties.name
                  const count = counts[name] ?? 0
                  const isActive = activeName === name
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => setHovered(name)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        default: {
                          fill: colorScale(count),
                          stroke: '#ffffff',
                          strokeWidth: 0.75,
                          outline: 'none',
                        },
                        hover: {
                          fill: '#2e9e5b',
                          stroke: '#ffffff',
                          strokeWidth: 1,
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: { fill: '#2e9e5b', outline: 'none' },
                      }}
                      opacity={isActive ? 1 : 0.95}
                    />
                  )
                })
              }
            </Geographies>
          </ComposableMap>
          {activeName && (
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-sm font-semibold text-background shadow">
              {activeName}: {(counts[activeName] ?? 0).toLocaleString()} lucky picks
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Hover a province to see its luck activity. Only general province totals are
          shown — never exact locations or personal information.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-foreground">
            Add your province to the map
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Let others know luck is alive in your part of Canada.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              aria-label="Select your province"
              className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="" disabled>
                Choose your province…
              </option>
              {PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addLuck}
              disabled={!selected || isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              <Clover className="h-4 w-4" aria-hidden="true" />
              {isPending ? 'Adding…' : 'Add Luck'}
            </button>
          </div>
          {justAdded && (
            <p className="mt-3 text-sm font-semibold text-accent" role="status">
              Your luck was added to the map. Thanks for spreading a little luck!
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-foreground">
            Luckiest provinces
          </h3>
          <ul className="mt-4 space-y-2">
            {ranked.map((r) => (
              <li
                key={r.name}
                onMouseEnter={() => setHovered(r.name)}
                onMouseLeave={() => setHovered(null)}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
              >
                <span className="w-5 text-sm font-bold text-muted-foreground">
                  {r.rank}
                </span>
                <span className="flex-1 text-sm font-semibold text-foreground">
                  {r.name}
                </span>
                <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-14 text-right text-sm tabular-nums text-muted-foreground">
                  {r.count.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
