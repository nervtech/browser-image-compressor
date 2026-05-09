import JSZip from 'jszip'

interface FileItem {
  name: string
  size: number
  type: string
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  compressedSize?: number
  compressedFile?: File
}

// Supported image formats
export const IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif']

// Validate that a file is a genuine, loadable image
export function isValidImage(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = URL.createObjectURL(file)
  })
}

// Process dragged files and directories
export async function processFiles(items: DataTransferItemList): Promise<FileItem[]> {
  const files: FileItem[] = []
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    if (item.kind === 'file') {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          await processEntry(entry, '', files)
        }
      } else {
        const file = item.getAsFile()
        if (file && IMAGE_FORMATS.includes(file.type)) {
          files.push({
            name: file.name,
            size: file.size,
            type: file.type,
            file,
            status: 'pending'
          })
        }
      }
    }
  }
  
  return files
}

// Recursively process file system entries
async function processEntry(entry: FileSystemEntry, path: string, files: FileItem[]): Promise<void> {
  if (entry.isDirectory) {
    const directoryReader = (entry as FileSystemDirectoryEntry).createReader()
    const entries = await readDirectory(directoryReader)
    
    for (const subEntry of entries) {
      await processEntry(subEntry, `${path}${entry.name}/`, files)
    }
  } else if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry
    const file = await getFileFromEntry(fileEntry)
    
    if (file && IMAGE_FORMATS.includes(file.type)) {
      files.push({
        name: `${path}${file.name}`,
        size: file.size,
        type: file.type,
        file,
        status: 'pending'
      })
    }
  }
}

// Read directory contents
function readDirectory(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = []
    
    function readEntries() {
      reader.readEntries(
        (results) => {
          if (results.length) {
            entries.push(...results)
            readEntries()
          } else {
            resolve(entries)
          }
        },
        (error) => {
          reject(error)
        }
      )
    }
    
    readEntries()
  })
}

// Get file from file entry
function getFileFromEntry(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(
      (file) => resolve(file),
      () => resolve(null)
    )
  })
}

// Compress image
export async function compressImage(
  file: File,
  quality: number,
  format: string,
  maxWidth?: number,
  maxHeight?: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      let w = img.width
      let h = img.height

      // Apply dimension limits, maintaining aspect ratio
      if (maxWidth && w > maxWidth) {
        h = Math.round(h * (maxWidth / w))
        w = maxWidth
      }
      if (maxHeight && h > maxHeight) {
        w = Math.round(w * (maxHeight / h))
        h = maxHeight
      }

      canvas.width = w
      canvas.height = h
      ctx?.drawImage(img, 0, 0, w, h)

      // PNG ignores quality parameter, always use lossless
      let finalQuality = quality
      if (format === 'png' && quality < 1) {
        finalQuality = 1
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // If compressed is larger than original, keep original
            if (blob.size > file.size) {
              resolve(file)
            } else {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, `.${format}`),
                { type: `image/${format}` },
              )
              resolve(compressedFile)
            }
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        `image/${format}`,
        finalQuality,
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

// Binary search + step-down resolution to hit target file size
export async function compressImageWithTargetSize(
  file: File,
  targetSize: number,
  format: string,
  lockResolution = false,
): Promise<File> {
  // Step 1: Binary search on quality (at original resolution)
  let bestResult = await binarySearchQuality(file, targetSize, format)

  if (bestResult && bestResult.size <= targetSize) {
    return bestResult
  }

  // Step 2: If quality alone can't reach target, progressively reduce resolution
  // (skipped when lockResolution is enabled)
  if (!lockResolution) {
    const resolutions = [2560, 1920, 1280, 960, 640]
    for (const maxDim of resolutions) {
      const img = await loadImage(file)
      const longestSide = Math.max(img.width, img.height)
      if (longestSide <= maxDim) continue

      bestResult = await binarySearchQuality(file, targetSize, format, maxDim)
      if (bestResult && bestResult.size <= targetSize) {
        return bestResult
      }
    }
  }

  // Return best effort result (smallest we achieved)
  return bestResult || file
}

// Binary search for optimal quality parameter
async function binarySearchQuality(
  file: File,
  targetSize: number,
  format: string,
  maxDimension?: number,
): Promise<File | null> {
  let lo = 0.05
  let hi = 1.0
  let bestFile: File | null = null
  let bestSize = Infinity
  const ITERATIONS = 8

  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (lo + hi) / 2
    const result = await compressImage(file, mid, format, maxDimension, maxDimension)

    if (result.size <= targetSize) {
      // This quality works — try higher
      bestFile = result
      bestSize = result.size
      lo = mid
    } else {
      // Too large — need lower quality
      hi = mid
    }

    // If we're close enough to target (within 10%), stop early
    if (bestFile && bestSize >= targetSize * 0.9) break
  }

  return bestFile
}

// Load image to get dimensions
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image for dimension check'))
    img.src = URL.createObjectURL(file)
  })
}

// Create ZIP file
export async function createZip(files: File[]): Promise<Blob> {
  const zip = new JSZip()
  
  // Add each file to the zip
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    zip.file(file.name, arrayBuffer)
  }
  
  // Generate the zip file
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  })
  
  return blob
}