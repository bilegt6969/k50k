'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, X, Plus, Eye } from 'lucide-react'
import ImageInspector from './ImageInspector'

interface DragDropImageGalleryProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  className?: string
}

interface DragItem {
  index: number
  id: string
}

export default function DragDropImageGallery({ 
  images, 
  onImagesChange, 
  maxImages = 12,
  className = '' 
}: DragDropImageGalleryProps) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [inspectorImage, setInspectorImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem({ index, id: images[index] })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    
    if (!draggedItem || draggedItem.index === dropIndex) return

    const newImages = [...images]
    const draggedImage = newImages[draggedItem.index]
    
    // Remove from old position
    newImages.splice(draggedItem.index, 1)
    
    // Insert at new position
    const adjustedDropIndex = draggedItem.index < dropIndex ? dropIndex - 1 : dropIndex
    newImages.splice(adjustedDropIndex, 0, draggedImage)
    
    onImagesChange(newImages)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      // Upload each file to the server
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }
        
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Upload failed')
        }
        
        return result.url
      })
      
      const uploadedImages = await Promise.all(uploadPromises)
      const combinedImages = [...images, ...uploadedImages].slice(0, maxImages)
      onImagesChange(combinedImages)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload images. Please try again.')
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddImage = () => {
    fileInputRef.current?.click()
  }

  const openInspector = (imageSrc: string) => {
    setInspectorImage(imageSrc)
  }

  const closeInspector = () => {
    setInspectorImage(null)
  }

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">Product Images</h3>
          <div className="text-sm text-neutral-600">
            {images.length} / {maxImages} images
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {images.map((image, index) => (
              <motion.div
                key={image}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                drag
                dragMomentum={false}
                onDragStart={() => setDraggedItem({ index, id: images[index] })}
                onDragEnd={() => {
                  if (draggedItem && dragOverIndex !== null && draggedItem.index !== dragOverIndex) {
                    const newImages = [...images]
                    const draggedImage = newImages[draggedItem.index]
                    
                    // Remove from old position
                    newImages.splice(draggedItem.index, 1)
                    
                    // Insert at new position
                    const adjustedDropIndex = draggedItem.index < dragOverIndex ? dragOverIndex - 1 : dragOverIndex
                    newImages.splice(adjustedDropIndex, 0, draggedImage)
                    
                    onImagesChange(newImages)
                  }
                  setDraggedItem(null)
                  setDragOverIndex(null)
                }}
                className={`
                  relative aspect-square rounded-xl overflow-hidden bg-zinc-50 border-2 
                  cursor-move transition-all duration-200
                  ${dragOverIndex === index ? 'border-blue-500 scale-105' : 'border-zinc-200'}
                  ${draggedItem?.index === index ? 'opacity-50' : 'hover:border-zinc-300'}
                `}
              >
                {/* Image */}
                <div className="absolute inset-2">
                  <Image
                    src={image}
                    alt={`Product image ${index + 1}`}
                    fill
                    className="object-contain"
                    draggable={false}
                  />
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-1">
                    <GripVertical className="w-4 h-4 text-black" />
                  </div>
                  
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => openInspector(image)}
                      className="bg-white/90 backdrop-blur-sm rounded-full p-1 hover:bg-white transition-colors"
                      title="Inspect image"
                    >
                      <Eye className="w-4 h-4 text-black" />
                    </button>
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="bg-white/90 backdrop-blur-sm rounded-full p-1 hover:bg-white transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4 text-black" />
                    </button>
                  </div>

                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1">
                    <span className="text-xs font-medium text-black">#{index + 1}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Image Button */}
          {images.length < maxImages && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-xl border-2 border-dashed border-black/20 bg-black/5 hover:border-black/40 hover:bg-black/10 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center"
              onClick={handleAddImage}
            >
              <Plus className="w-8 h-8 text-black/40 mb-2" />
              <span className="text-sm text-black/60">Add Image</span>
              <span className="text-xs text-black/40 mt-1">
                {maxImages - images.length} remaining
              </span>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
          <p className="font-medium mb-1">Instructions:</p>
          <ul className="space-y-1 text-xs">
            <li>• Drag and drop images to reorder them</li>
            <li>• Click the eye icon to inspect image details</li>
            <li>• Click the X icon to remove an image</li>
            <li>• Click "Add Image" to upload new images</li>
            <li>• First image will be the main product image</li>
          </ul>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Image Inspector Modal */}
      {inspectorImage && (
        <ImageInspector
          src={inspectorImage}
          alt="Product image"
          isOpen={true}
          onClose={closeInspector}
        />
      )}
    </>
  )
}
