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

// 支持的图片格式
const IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// 处理拖放的文件和目录
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

// 递归处理文件系统条目
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

// 读取目录内容
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

// 从文件条目获取文件
function getFileFromEntry(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(
      (file) => resolve(file),
      () => resolve(null)
    )
  })
}

// 压缩图片
export async function compressImage(file: File, quality: number, format: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 设置canvas尺寸为原始图片尺寸
      canvas.width = img.width
      canvas.height = img.height
      
      // 绘制图片
      ctx?.drawImage(img, 0, 0)
      
      // 对于PNG格式，如果质量小于1，可能会导致文件变大，所以我们使用无损压缩
      let finalQuality = quality
      if (format === 'png' && quality < 1) {
        finalQuality = 1
      }
      
      // 将canvas转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // 如果压缩后的文件比原始文件大，我们使用原始文件
            if (blob.size > file.size) {
              resolve(file)
            } else {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, `.${format}`), {
                type: `image/${format}`
              })
              resolve(compressedFile)
            }
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        `image/${format}`,
        finalQuality
      )
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// 自动调整压缩质量以满足目标大小
export async function compressImageWithTargetSize(file: File, targetSize: number, format: string): Promise<File> {
  let quality = 1
  let compressedFile: File | null = null
  let attempt = 0
  const maxAttempts = 20
  
  while (attempt < maxAttempts) {
    compressedFile = await compressImage(file, quality, format)
    
    if (compressedFile.size <= targetSize) {
      // 如果已经满足目标大小，返回当前压缩后的文件
      return compressedFile
    }
    
    // 如果还没有满足，继续降低质量
    quality = Math.max(0.1, quality - 0.05)
    attempt++
  }
  
  // 如果经过maxAttempts次尝试后仍然没有满足目标大小，返回最后一次尝试的结果
  return compressedFile || file
}

// 创建ZIP文件
export async function createZip(files: File[]): Promise<Blob> {
  const zip = new JSZip()
  
  // 为每个文件添加到zip
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    zip.file(file.name, arrayBuffer)
  }
  
  // 生成zip文件
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  })
  
  return blob
}