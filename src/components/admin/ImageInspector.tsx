'use client'

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, ZoomIn, ZoomOut, RotateCw, Download, Info } from 'lucide-react'

interface ImageInspectorProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
  metadata?: {
    width?: number
    height?: number
    fileSize?: string
    format?: string
  }
}

export default function ImageInspector({ src, alt, isOpen, onClose, metadata }: ImageInspectorProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showMetadata, setShowMetadata] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }, [zoom, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = src
    link.download = alt || 'image'
    link.click()
  }, [src, alt])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-white text-sm font-medium min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
              title="Reset"
            >
              Reset
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Toggle metadata"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <Image
                ref={imageRef}
                src={src}
                alt={alt}
                width={800}
                height={800}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </div>
          </div>

          {/* Metadata Panel */}
          {showMetadata && metadata && (
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md rounded-lg p-4 text-white text-sm">
              <h3 className="font-semibold mb-2">Image Metadata</h3>
              <div className="space-y-1">
                {metadata.width && metadata.height && (
                  <div>Dimensions: {metadata.width} × {metadata.height}px</div>
                )}
                {metadata.fileSize && <div>File Size: {metadata.fileSize}</div>}
                {metadata.format && <div>Format: {metadata.format}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/50 backdrop-blur-md text-center">
          <p className="text-white/60 text-sm">
            {zoom > 1 ? 'Click and drag to pan' : 'Use zoom controls to inspect image details'}
          </p>
        </div>
      </div>
    </div>
  )
}
