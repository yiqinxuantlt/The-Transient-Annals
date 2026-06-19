import { useCallback, useEffect, useRef, useState } from 'react'
import type { AvatarCrop } from '../types'

type Props = {
  imageUrl: string
  initialCrop?: AvatarCrop
  onCropChange: (crop: AvatarCrop) => void
}

export default function AvatarCropper({ imageUrl, initialCrop, onCropChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
  const [previewUrl, setPreviewUrl] = useState('')

  // 将自然尺寸坐标转换为显示尺寸坐标
  const toDisplay = useCallback((value: number) => {
    if (!naturalSize.width || !displaySize.width) return value
    return (value / naturalSize.width) * displaySize.width
  }, [naturalSize.width, displaySize.width])

  // 将显示尺寸坐标转换为自然尺寸坐标
  const toNatural = useCallback((value: number) => {
    if (!naturalSize.width || !displaySize.width) return value
    return (value / displaySize.width) * naturalSize.width
  }, [naturalSize.width, displaySize.width])

  // 默认裁剪区域为图片中心正方形（自然尺寸）
  const getDefaultCrop = useCallback((imgWidth: number, imgHeight: number): AvatarCrop => {
    const size = Math.min(imgWidth, imgHeight) * 0.8
    return {
      x: (imgWidth - size) / 2,
      y: (imgHeight - size) / 2,
      width: size,
      height: size,
    }
  }, [])

  const [crop, setCrop] = useState<AvatarCrop>(() => {
    if (initialCrop) return initialCrop
    return { x: 0, y: 0, width: 100, height: 100 }
  })

  // 生成预览图片
  const generatePreview = useCallback((currentCrop: AvatarCrop) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = currentCrop.width
      canvas.height = currentCrop.height
      ctx.drawImage(img, currentCrop.x, currentCrop.y, currentCrop.width, currentCrop.height, 0, 0, currentCrop.width, currentCrop.height)
      setPreviewUrl(canvas.toDataURL())
    }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    const img = imageRef.current
    if (!img) return

    const handleLoad = () => {
      const rect = img.getBoundingClientRect()
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
      setDisplaySize({ width: rect.width, height: rect.height })

      if (!initialCrop) {
        const defaultCrop = getDefaultCrop(img.naturalWidth, img.naturalHeight)
        setCrop(defaultCrop)
        onCropChange(defaultCrop)
        generatePreview(defaultCrop)
      } else {
        generatePreview(initialCrop)
      }
    }

    if (img.complete) {
      handleLoad()
    } else {
      img.addEventListener('load', handleLoad)
      return () => img.removeEventListener('load', handleLoad)
    }
  }, [imageUrl, initialCrop, getDefaultCrop, onCropChange, generatePreview])

  const getRelativePosition = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const constrainCrop = useCallback((newCrop: AvatarCrop): AvatarCrop => {
    const maxX = naturalSize.width - newCrop.width
    const maxY = naturalSize.height - newCrop.height

    return {
      x: Math.max(0, Math.min(maxX, newCrop.x)),
      y: Math.max(0, Math.min(maxY, newCrop.y)),
      width: Math.min(newCrop.width, naturalSize.width),
      height: Math.min(newCrop.height, naturalSize.height),
    }
  }, [naturalSize])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const pos = getRelativePosition(e.clientX, e.clientY)
    setDragStart({
      x: toNatural(pos.x) - crop.x,
      y: toNatural(pos.y) - crop.y,
    })
  }, [crop, getRelativePosition, toNatural])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const pos = getRelativePosition(e.clientX, e.clientY)
    const newCrop = constrainCrop({
      ...crop,
      x: toNatural(pos.x) - dragStart.x,
      y: toNatural(pos.y) - dragStart.y,
    })
    setCrop(newCrop)
    onCropChange(newCrop)
    generatePreview(newCrop)
  }, [isDragging, dragStart, crop, getRelativePosition, constrainCrop, onCropChange, toNatural, generatePreview])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -20 : 20
    const newSize = Math.max(50, Math.min(Math.min(naturalSize.width, naturalSize.height), crop.width + delta))
    const centerX = crop.x + crop.width / 2
    const centerY = crop.y + crop.height / 2

    const newCrop = constrainCrop({
      x: centerX - newSize / 2,
      y: centerY - newSize / 2,
      width: newSize,
      height: newSize,
    })
    setCrop(newCrop)
    onCropChange(newCrop)
    generatePreview(newCrop)
  }, [crop, naturalSize, constrainCrop, onCropChange, generatePreview])

  // 计算显示用的裁剪框位置和大小
  const displayCrop = {
    x: toDisplay(crop.x),
    y: toDisplay(crop.y),
    width: toDisplay(crop.width),
    height: toDisplay(crop.height),
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* 裁剪区域 */}
        <div className="flex-1">
          <p className="mb-2 text-xs text-ink-500">拖拽调整位置，滚轮调整大小</p>
          <div
            ref={containerRef}
            className="relative inline-block overflow-hidden rounded-lg border border-goldline/30 bg-paper-100/50"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="待裁剪图片"
              className="block max-h-80 max-w-full"
              draggable={false}
            />
            {/* 遮罩层 */}
            <div
              className="absolute inset-0 bg-ink-900/40"
              style={{
                clipPath: `polygon(
                  0% 0%,
                  0% 100%,
                  ${displayCrop.x}px 100%,
                  ${displayCrop.x}px ${displayCrop.y}px,
                  ${displayCrop.x + displayCrop.width}px ${displayCrop.y}px,
                  ${displayCrop.x + displayCrop.width}px ${displayCrop.y + displayCrop.height}px,
                  ${displayCrop.x}px ${displayCrop.y + displayCrop.height}px,
                  ${displayCrop.x}px 100%,
                  100% 100%,
                  100% 0%
                )`,
              }}
            />
            {/* 裁剪框 */}
            <div
              className="absolute border-2 border-cinnabar/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"
              style={{
                left: `${displayCrop.x}px`,
                top: `${displayCrop.y}px`,
                width: `${displayCrop.width}px`,
                height: `${displayCrop.height}px`,
              }}
            >
              {/* 网格线 */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute left-1/3 top-0 h-full w-px bg-white" />
                <div className="absolute left-2/3 top-0 h-full w-px bg-white" />
                <div className="absolute left-0 top-1/3 h-px w-full bg-white" />
                <div className="absolute left-0 top-2/3 h-px w-full bg-white" />
              </div>
              {/* 四角标记 */}
              <div className="absolute -left-1 -top-1 h-3 w-3 border-l-2 border-t-2 border-cinnabar" />
              <div className="absolute -right-1 -top-1 h-3 w-3 border-r-2 border-t-2 border-cinnabar" />
              <div className="absolute -left-1 -bottom-1 h-3 w-3 border-l-2 border-b-2 border-cinnabar" />
              <div className="absolute -right-1 -bottom-1 h-3 w-3 border-r-2 border-b-2 border-cinnabar" />
            </div>
          </div>
        </div>

        {/* 预览区域 */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-ink-500">预览效果</p>
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-goldline/30 shadow-soft">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="裁剪预览"
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-paper-100/50">
                <span className="text-xs text-ink-400">加载中...</span>
              </div>
            )}
          </div>
          <p className="text-xs text-ink-400">圆形头像效果</p>
        </div>
      </div>
    </div>
  )
}
