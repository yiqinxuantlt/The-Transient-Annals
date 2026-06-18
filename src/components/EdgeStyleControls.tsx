import clsx from 'clsx'
import type { EdgeLineStyle, EdgeTone, EdgeType, EdgeVisualStyle } from '../types'

const lineStyles: Array<{ value: EdgeLineStyle; label: string; dash: string }> = [
  { value: 'solid', label: '实线', dash: 'none' },
  { value: 'dashed', label: '虚线', dash: '8 6' },
  { value: 'dotted', label: '点线', dash: '2 6' },
]

const tones: Array<{ value: EdgeTone; label: string; className: string }> = [
  { value: 'cinnabar', label: '朱砂', className: 'bg-cinnabar' },
  { value: 'jade', label: '青玉', className: 'bg-jade' },
  { value: 'goldline', label: '金线', className: 'bg-goldline' },
  { value: 'ink', label: '墨色', className: 'bg-ink-700' },
]

const edgeTypes: Array<{ value: EdgeType; label: string; icon: string }> = [
  { value: 'straight', label: '直线', icon: '─' },
  { value: 'smoothstep', label: '折线', icon: '⌐' },
  { value: 'bezier', label: '曲线', icon: '∼' },
  { value: 'step', label: '阶梯', icon: '⊏' },
]

type Props = {
  value?: EdgeVisualStyle
  onChange: (style: EdgeVisualStyle) => void
}

export default function EdgeStyleControls({ value, onChange }: Props) {
  const nextValue = {
    lineStyle: value?.lineStyle || 'solid',
    tone: value?.tone || 'cinnabar',
    edgeType: value?.edgeType || 'smoothstep',
    lineWidth: value?.lineWidth || 2,
    animated: Boolean(value?.animated),
  } satisfies Required<EdgeVisualStyle>

  const update = (patch: Partial<EdgeVisualStyle>) => onChange({ ...nextValue, ...patch })

  return (
    <div className="grid gap-3">
      {/* Line style */}
      <div>
        <p className="mb-2 text-xs text-ink-500">线型</p>
        <div className="grid grid-cols-3 gap-2">
          {lineStyles.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => update({ lineStyle: item.value })}
              className={clsx(
                'min-h-10 rounded-lg border px-2 text-xs transition',
                nextValue.lineStyle === item.value
                  ? 'border-goldline bg-goldline/12 text-ink-900'
                  : 'border-ink-900/10 bg-paper-50/65 text-ink-600 hover:border-goldline/45',
              )}
            >
              <span
                className="mx-auto mb-1 block h-px w-8"
                style={{
                  borderTop: item.dash === 'none' ? '2px solid currentColor' : `2px dashed currentColor`,
                  background: item.dash === 'none' ? undefined : 'transparent',
                }}
              />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Edge routing type */}
      <div>
        <p className="mb-2 text-xs text-ink-500">连线类型</p>
        <div className="grid grid-cols-4 gap-1.5">
          {edgeTypes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => update({ edgeType: item.value })}
              className={clsx(
                'flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] transition',
                nextValue.edgeType === item.value
                  ? 'border-goldline bg-goldline/12 text-ink-900'
                  : 'border-ink-900/10 bg-paper-50/65 text-ink-600 hover:border-goldline/45',
              )}
            >
              <span className="text-sm font-mono leading-none">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <p className="mb-2 text-xs text-ink-500">颜色</p>
        <div className="grid grid-cols-4 gap-2">
          {tones.map((tone) => (
            <button
              key={tone.value}
              type="button"
              onClick={() => update({ tone: tone.value })}
              className={clsx(
                'flex min-h-10 items-center justify-center rounded-lg border transition',
                nextValue.tone === tone.value
                  ? 'border-goldline bg-goldline/12'
                  : 'border-ink-900/10 bg-paper-50/65 hover:border-goldline/45',
              )}
              title={tone.label}
              aria-label={tone.label}
            >
              <span className={clsx('h-4 w-4 rounded-full shadow-sm', tone.className)} />
            </button>
          ))}
        </div>
      </div>

      {/* Line width */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-ink-500">线宽</p>
          <span className="text-xs tabular-nums text-ink-600">{nextValue.lineWidth}px</span>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          step={0.5}
          value={nextValue.lineWidth}
          onChange={(event) => update({ lineWidth: Number(event.target.value) })}
          className="w-full accent-[rgb(var(--goldline))]"
        />
      </div>

      {/* Animation toggle */}
      <label className="flex min-h-10 items-center justify-between rounded-lg border border-ink-900/10 bg-paper-50/65 px-3 text-sm text-ink-700">
        <span>流动效果</span>
        <input
          type="checkbox"
          checked={nextValue.animated}
          onChange={(event) => update({ animated: event.target.checked })}
          className="h-4 w-4 accent-[rgb(var(--cinnabar))]"
        />
      </label>
    </div>
  )
}
