// electron/main.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: '文件压缩',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // 加载应用的index.html
  const indexPath = path.join(__dirname, '../dist/index.html');
  console.log('Loading index.html from:', indexPath);
  
  mainWindow.loadFile(indexPath);

  // 窗口关闭时触发
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // 页面加载完成后设置标题
  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.setTitle('文件压缩');
  });
}

// Electron完成初始化后创建窗口
app.on('ready', createWindow);

// 关闭所有窗口时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 点击Dock图标时重新创建窗口（仅Mac）
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});