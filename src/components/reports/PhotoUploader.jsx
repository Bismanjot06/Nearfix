import { useRef, useState } from 'react'
import { Camera, Upload, X, Image } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { compressImage } from '../../lib/utils.js'

export function PhotoUploader({ onPhotoSelect, preview, onClear }) {
  const inputRef = useRef(null)
  const [compressing, setCompressing] = useState(false)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    try {
      const compressed = await compressImage(file)
      const previewUrl = URL.createObjectURL(compressed)
      onPhotoSelect(compressed, previewUrl)
    } catch {
      onPhotoSelect(file, URL.createObjectURL(file))
    }
    setCompressing(false)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  if (preview) {
    return (
      <div className="relative w-full">
        <img
          src={preview}
          alt="Selected"
          className="w-full h-48 object-cover rounded-2xl"
        />
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 bg-surface rounded-full p-1.5 shadow-md text-ink-muted hover:text-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-2 left-2 bg-surface/90 backdrop-blur-sm rounded-xl px-2 py-1">
          <span className="text-xs font-medium text-ink">Photo selected ✓</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="border-2 border-dashed border-line rounded-2xl p-8 text-center bg-surface-muted">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 rounded-full flex items-center justify-center mx-auto mb-3">
          <Image className="h-6 w-6 text-brand-blue" />
        </div>
        <p className="text-sm font-medium text-ink mb-1">Add a photo of the pothole</p>
        <p className="text-xs text-ink-muted mb-4">Required · Will be compressed automatically</p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            loading={compressing}
            disabled={compressing}
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            loading={compressing}
            disabled={compressing}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>
    </div>
  )
}
