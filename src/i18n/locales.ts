export type Locale = 'zh-CN' | 'en' | 'ja'

export type MessageKey =
  | 'app.title'
  | 'app.subtitle'
  | 'drop.title'
  | 'drop.subtitle'
  | 'settings.title'
  | 'settings.mode'
  | 'settings.modeQuality'
  | 'settings.modeSize'
  | 'settings.quality'
  | 'settings.targetSize'
  | 'settings.format'
  | 'fileList.title'
  | 'fileList.name'
  | 'fileList.originalSize'
  | 'fileList.compressedSize'
  | 'fileList.status'
  | 'fileList.action'
  | 'status.pending'
  | 'status.processing'
  | 'status.completed'
  | 'status.error'
  | 'button.download'
  | 'button.compress'
  | 'button.compressing'
  | 'button.downloadAll'
  | 'button.downloadFile'
  | 'button.remove'
  | 'button.clearAll'
  | 'button.addFiles'
  | 'progress.compressOne'
  | 'lang.switch'

export const messages: Record<Locale, Record<MessageKey, string>> = {
  'zh-CN': {
    'app.title': '文件压缩',
    'app.subtitle': '拖拽文件或文件夹到此处进行图片压缩',
    'drop.title': '拖拽文件到此处',
    'drop.subtitle': '支持图片和文件夹',
    'settings.title': '压缩设置',
    'settings.mode': '压缩模式',
    'settings.modeQuality': '质量控制',
    'settings.modeSize': '大小控制',
    'settings.quality': '压缩质量',
    'settings.targetSize': '目标大小 (KB)',
    'settings.format': '输出格式',
    'fileList.title': '文件列表',
    'fileList.name': '文件名',
    'fileList.originalSize': '原始大小',
    'fileList.compressedSize': '压缩后大小',
    'fileList.status': '状态',
    'fileList.action': '操作',
    'status.pending': '等待中',
    'status.processing': '处理中',
    'status.completed': '已完成',
    'status.error': '错误',
    'button.download': '下载',
    'button.compress': '压缩图片',
    'button.compressing': '压缩中...',
    'button.downloadAll': '下载所有压缩文件',
    'button.downloadFile': '下载压缩文件',
    'button.remove': '移除',
    'button.clearAll': '清空',
    'button.addFiles': '添加文件',
    'progress.compressOne': '压缩中 ({current}/{total})',
    'lang.switch': '语言',
  },
  en: {
    'app.title': 'Image Compressor',
    'app.subtitle': 'Drag and drop files or folders here to compress images',
    'drop.title': 'Drop files here',
    'drop.subtitle': 'Supports images and folders',
    'settings.title': 'Compression Settings',
    'settings.mode': 'Compression Mode',
    'settings.modeQuality': 'Quality Control',
    'settings.modeSize': 'Size Control',
    'settings.quality': 'Quality',
    'settings.targetSize': 'Target Size (KB)',
    'settings.format': 'Output Format',
    'fileList.title': 'File List',
    'fileList.name': 'File Name',
    'fileList.originalSize': 'Original Size',
    'fileList.compressedSize': 'Compressed Size',
    'fileList.status': 'Status',
    'fileList.action': 'Action',
    'status.pending': 'Pending',
    'status.processing': 'Processing',
    'status.completed': 'Completed',
    'status.error': 'Error',
    'button.download': 'Download',
    'button.compress': 'Compress Images',
    'button.compressing': 'Compressing...',
    'button.downloadAll': 'Download All Compressed Files',
    'button.downloadFile': 'Download Compressed File',
    'button.remove': 'Remove',
    'button.clearAll': 'Clear All',
    'button.addFiles': 'Add Files',
    'progress.compressOne': 'Compressing ({current}/{total})',
    'lang.switch': 'Language',
  },
  ja: {
    'app.title': '画像圧縮',
    'app.subtitle': 'ファイルやフォルダをここにドラッグ＆ドロップして画像を圧縮',
    'drop.title': 'ファイルをドロップ',
    'drop.subtitle': '画像とフォルダに対応',
    'settings.title': '圧縮設定',
    'settings.mode': '圧縮モード',
    'settings.modeQuality': '品質制御',
    'settings.modeSize': 'サイズ制御',
    'settings.quality': '品質',
    'settings.targetSize': '目標サイズ (KB)',
    'settings.format': '出力形式',
    'fileList.title': 'ファイル一覧',
    'fileList.name': 'ファイル名',
    'fileList.originalSize': '元のサイズ',
    'fileList.compressedSize': '圧縮後のサイズ',
    'fileList.status': '状態',
    'fileList.action': '操作',
    'status.pending': '待機中',
    'status.processing': '処理中',
    'status.completed': '完了',
    'status.error': 'エラー',
    'button.download': 'ダウンロード',
    'button.compress': '画像を圧縮',
    'button.compressing': '圧縮中...',
    'button.downloadAll': 'すべての圧縮ファイルをダウンロード',
    'button.downloadFile': '圧縮ファイルをダウンロード',
    'button.remove': '削除',
    'button.clearAll': '全てクリア',
    'button.addFiles': 'ファイル追加',
    'progress.compressOne': '圧縮中 ({current}/{total})',
    'lang.switch': '言語',
  },
}
