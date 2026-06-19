import clsx from 'clsx'
import type {
  EdgeArrowStyle,
  EdgeLineCap,
  EdgeLineStyle,
  EdgeTone,
  EdgeType,
  EdgeVisualStyle,
} from '../types'

const lineStyles: Array<{ value: EdgeLineStyle; label: string; dash: string }> = [
  { value: 'solid', label: '实线', dash: 'solid' },
  { value: 'dashed', label: '虚线', dash: 'dashed' },
  { value: 'dotted', label: '点线', dash: 'dotted' },
  { value: 'custom', label: '自定', dash: 'dashed' },
]

const tones: Array<{ value: EdgeTone; label: string; className: string; hex: string }> = [
  { value: 'cinnabar', label: '朱砂', className: 'bg-cinnabar', hex: '#9f4c3f' },
  { value: 'jade', label: '青玉', className: 'bg-jade', hex: '#55786f' },
  { value: 'goldline', label: '金线', className: 'bg-goldline', hex: '#b99a5f' },
  { value: 'ink', label: '墨色', className: 'bg-ink-700', hex: '#51483c' },
]

const toneHex = Object.fromEntries(tones.map((tone) => [tone.value, tone.hex])) as Record<EdgeTone, string>

const edgeTypes: Array<{ value: EdgeType; label: string; icon: string }> = [
  { value: 'straight', label: '直线', icon: '-' },
  { value: 'smoothstep', label: '折线', icon: '┐' },
  { value: 'bezier', label: '曲线', icon: '~' },
  { value: 'step', label: '阶梯', icon: 'L' },
]

const arrows: Array<{ value: EdgeArrowStyle; label: string; icon: string }> = [
  { value: 'none', label: '无', icon: '-' },
  { value: 'target', label: '尾端', icon: '->' },
  { value: 'source', label: '首端', icon: '<-' },
  { value: 'both', label: '双向', icon: '<->' },
]

const lineCaps: Array<{ value: EdgeLineCap; label: string }> = [
  { value: 'round', label: '圆角' },
  { value: 'butt', label: '平切' },
  { value: 'square', label: '方头' },
]

type ResolvedControlValue = {
  lineStyle: EdgeLineStyle
  tone: EdgeTone
  edgeType: EdgeType
  lineWidth: number
  animated: boolean
  customColor?: string
  opacity: number
  dashLength: number
  dashGap: number
  arrow: EdgeArrowStyle
  lineCap: EdgeLineCap
  labelVisible: boolean
  shadow: boolean
}

type Props = {
  value?: EdgeVisualStyle
  onChange: (style: EdgeVisualStyle) => void
}

function resolveValue(value?: EdgeVisualStyle): ResolvedControlValue {
  const lineStyle = value?.lineStyle || 'solid'

  return {
    lineStyle,
    tone: value?.tone || 'cinnabar',
    edgeType: value?.edgeType || 'smoothstep',
    lineWidth: value?.lineWidth || 2,
    animated: Boolean(value?.animated),
    customColor: value?.customColor,
    opacity: value?.opacity ?? 1,
    dashLength: value?.dashLength ?? (lineStyle === 'dotted' ? 2 : 8),
    dashGap: value?.dashGap ?? (lineStyle === 'dotted' ? 8 : 7),
    arrow: value?.arrow || 'target',
    lineCap: value?.lineCap || 'round',
    labelVisible: value?.labelVisible ?? true,
    shadow: value?.shadow ?? true,
  }
}

function optionClass(active: boolean) {
  return clsx(
    'min-h-9 rounded-lg border px-2 text-xs transition',
    active
      ? 'border-goldline bg-goldline/12 text-ink-900'
      : 'border-ink-900/10 bg-paper-50/65 text-ink-600 hover:border-goldline/45',
  )
}

export default function EdgeStyleControls({ value, onChange }: Props) {
  const nextValue = resolveValue(value)
  const dashDisabled = nextValue.lineStyle === 'solid'
  const update = (patch: Partial<EdgeVisualStyle>) => onChange({ ...nextValue, ...patch })

  return (
    <div className="grid gap-4">
      <div>
        <p className="mb-2 text-xs text-ink-500">线型</p>
        <div className="grid grid-cols-4 gap-1.5">
          {lineStyles.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={nextValue.lineStyle === item.value}
              onClick={() => update({ lineStyle: item.value })}
              className={optionClass(nextValue.lineStyle === item.value)}
            >
              <span
                className="mx-auto mb-1 block h-px w-8"
                style={{ borderTop: `2px ${item.dash} currentColor` }}
              />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-ink-500">路径</p>
        <div className="grid grid-cols-4 gap-1.5">
          {edgeTypes.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={nextValue.edgeType === item.value}
              onClick={() => update({ edgeType: item.value })}
              className={clsx(
                'flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] transition',
                nextValue.edgeType === item.value
                  ? 'border-goldline bg-goldline/12 text-ink-900'
                  : 'border-ink-900/10 bg-paper-50/65 text-ink-600 hover:border-goldline/45',
              )}
            >
              <span className="font-mono text-sm leading-none">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-ink-500">颜色</p>
        <div className="grid grid-cols-4 gap-2">
          {tones.map((tone) => (
            <button
              key={tone.value}
              type="button"
              aria-pressed={!nextValue.customColor && nextValue.tone === tone.value}
              onClick={() => update({ tone: tone.value, customColor: undefined })}
              className={clsx(
                'flex min-h-10 items-center justify-center rounded-lg border transition',
                !nextValue.customColor && nextValue.tone === tone.value
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
        <div className="mt-2 flex min-h-11 items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/65 px-2">
          <input
            type="color"
            value={nextValue.customColor || toneHex[nextValue.tone]}
            onChange={(event) => update({ customColor: event.target.value })}
            aria-label="自定义颜色"
            className="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-ink-700">自定义颜色</p>
            <p className="truncate text-[11px] text-ink-500">
              {nextValue.customColor || '跟随主题色'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => update({ customColor: undefined })}
            className="rounded-md px-2 py-1 text-xs text-ink-500 transition hover:bg-goldline/10 hover:text-ink-800"
          >
            重置
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-ink-500">线宽</p>
            <span className="text-xs tabular-nums text-ink-600">{nextValue.lineWidth}px</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={12}
            step={0.5}
            value={nextValue.lineWidth}
            onChange={(event) => update({ lineWidth: Number(event.target.value) })}
            className="w-full accent-[rgb(var(--goldline))]"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-ink-500">透明度</p>
            <span className="text-xs tabular-nums text-ink-600">
              {Math.round(nextValue.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={nextValue.opacity}
            onChange={(event) => update({ opacity: Number(event.target.value) })}
            className="w-full accent-[rgb(var(--goldline))]"
          />
        </div>
      </div>

      <div className={clsx('grid gap-3', dashDisabled && 'opacity-45')}>
        <p className="text-xs text-ink-500">虚线节奏</p>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-ink-500">线段</span>
            <span className="text-xs tabular-nums text-ink-600">{nextValue.dashLength}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={32}
            step={1}
            disabled={dashDisabled}
            value={nextValue.dashLength}
            onChange={(event) => update({ dashLength: Number(event.target.value) })}
            className="w-full accent-[rgb(var(--goldline))] disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-ink-500">间距</span>
            <span className="text-xs tabular-nums text-ink-600">{nextValue.dashGap}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={32}
            step={1}
            disabled={dashDisabled}
            value={nextValue.dashGap}
            onChange={(event) => update({ dashGap: Number(event.target.value) })}
            className="w-full accent-[rgb(var(--goldline))] disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-xs text-ink-500">箭头</p>
          <div className="grid grid-cols-2 gap-1.5">
            {arrows.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={nextValue.arrow === item.value}
                onClick={() => update({ arrow: item.value })}
                className={optionClass(nextValue.arrow === item.value)}
              >
                <span className="mr-1 font-mono">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-ink-500">端点</p>
          <div className="grid gap-1.5">
            {lineCaps.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={nextValue.lineCap === item.value}
                onClick={() => update({ lineCap: item.value })}
                className={optionClass(nextValue.lineCap === item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="flex min-h-10 items-center justify-between rounded-lg border border-ink-900/10 bg-paper-50/65 px-3 text-sm text-ink-700">
          <span>显示标签</span>
          <input
            type="checkbox"
            checked={nextValue.labelVisible}
            onChange={(event) => update({ labelVisible: event.target.checked })}
            className="h-4 w-4 accent-[rgb(var(--cinnabar))]"
          />
        </label>
        <label className="flex min-h-10 items-center justify-between rounded-lg border border-ink-900/10 bg-paper-50/65 px-3 text-sm text-ink-700">
          <span>投影层次</span>
          <input
            type="checkbox"
            checked={nextValue.shadow}
            onChange={(event) => update({ shadow: event.target.checked })}
            className="h-4 w-4 accent-[rgb(var(--cinnabar))]"
          />
        </label>
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
    </div>
  )
}
