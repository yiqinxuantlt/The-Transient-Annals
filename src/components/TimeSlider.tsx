import { Pause, Play, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  minYear: number
  maxYear: number
  currentYear: number | null
  onYearChange: (year: number | null) => void
  speed?: number
}

function formatYear(year: number): string {
  if (year < 0) return `前${Math.abs(year)}年`
  if (year === 0) return '公元元年'
  return `${year}年`
}

export default function TimeSlider({
  minYear,
  maxYear,
  currentYear,
  onYearChange,
  speed = 600,
}: Props) {
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const effectiveYear = currentYear ?? maxYear
  const currentYearRef = useRef(effectiveYear)
  const totalRange = maxYear - minYear

  useEffect(() => {
    currentYearRef.current = effectiveYear
  }, [effectiveYear])

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }

    intervalRef.current = setInterval(() => {
      const nextYear = currentYearRef.current + 1
      if (nextYear >= maxYear) {
        onYearChange(maxYear)
        setPlaying(false)
        return
      }
      onYearChange(nextYear)
    }, speed)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [maxYear, onYearChange, playing, speed])

  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onYearChange(Number(event.target.value))
    },
    [onYearChange],
  )

  const togglePlay = useCallback(() => {
    if (effectiveYear >= maxYear) {
      onYearChange(minYear)
      setPlaying(true)
      return
    }
    setPlaying((prev) => !prev)
  }, [effectiveYear, maxYear, minYear, onYearChange])

  const handleReset = useCallback(() => {
    setPlaying(false)
    onYearChange(null)
  }, [onYearChange])

  const progress = totalRange > 0 ? ((effectiveYear - minYear) / totalRange) * 100 : 0
  const notchYears = useMemo(() => computeNotchYears(minYear, maxYear), [minYear, maxYear])

  if (totalRange <= 0) {
    return null
  }

  return (
    <div className="relative rounded-xl border border-goldline/25 bg-paper-50/95 px-5 py-4 shadow-soft backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-goldline/30 bg-paper-50 text-ink-700 shadow-soft transition hover:bg-goldline/8 hover:text-ink-900"
            title={playing ? '暂停' : '播放时间线'}
          >
            {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={[
              'flex h-9 w-9 items-center justify-center rounded-full border transition',
              currentYear != null
                ? 'border-cinnabar/30 text-cinnabar hover:bg-cinnabar/10'
                : 'cursor-default border-ink-900/10 text-ink-300',
            ].join(' ')}
            disabled={currentYear == null}
            title="显示全部年份"
          >
            <RotateCcw size={14} />
          </button>
          <span className="font-serif text-sm font-semibold text-ink-600">时间轴</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          {currentYear == null ? (
            <span className="font-serif text-lg font-bold tracking-wide text-ink-500">全部</span>
          ) : (
            <span className="font-serif text-xl font-bold tracking-wide text-ink-900">
              {formatYear(currentYear)}
            </span>
          )}
          <span className="text-xs text-ink-400">
            ({formatYear(minYear)} - {formatYear(maxYear)})
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-ink-900/8" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-goldline/60 to-cinnabar/50"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step={1}
          value={effectiveYear}
          onChange={handleSliderChange}
          className="relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cinnabar
            [&::-webkit-slider-thumb]:bg-paper-50 [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
            [&::-webkit-slider-thumb]:hover:scale-125
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-cinnabar [&::-moz-range-thumb]:bg-paper-50
            [&::-moz-range-thumb]:shadow-md"
        />
      </div>

      <div className="relative mt-1 h-5">
        {notchYears.map((year) => {
          const left = totalRange > 0 ? ((year - minYear) / totalRange) * 100 : 0
          return (
            <button
              key={year}
              type="button"
              onClick={() => onYearChange(year)}
              className="absolute -translate-x-1/2 text-[10px] text-ink-400 transition hover:text-ink-700"
              style={{ left: `${left}%` }}
              title={formatYear(year)}
            >
              <span className="inline-block h-1.5 w-px bg-ink-300" />
              <span className="mt-0.5 block">{formatYear(year)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function computeNotchYears(min: number, max: number): number[] {
  const range = max - min
  if (range <= 5) {
    const years: number[] = []
    for (let year = min; year <= max; year += 1) years.push(year)
    return years
  }

  const step = Math.max(1, Math.ceil(range / 6))
  const years: number[] = [min]
  let year = min + step
  while (year < max) {
    years.push(year)
    year += step
  }
  years.push(max)
  return years
}
