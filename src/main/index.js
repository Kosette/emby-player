import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
let mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        icon: path.join(__dirname, '../assets/emby_icon_512x512.png'),
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 10, y: 10 },
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        vibrancy: 'ultra-dark',
        visualEffectState: 'active',
        transparent: false,
    });
    // 开发环境下加载本地服务
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5174');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
app.whenReady().then(() => {
    createWindow();
    // 设置IPC通信处理窗口控制
    ipcMain.on('window-minimize', () => {
        if (mainWindow)
            mainWindow.minimize();
    });
    ipcMain.on('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            }
            else {
                mainWindow.maximize();
            }
        }
    });
    ipcMain.on('window-close', () => {
        if (mainWindow)
            mainWindow.close();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// IPC 通信处理
ipcMain.handle('get-app-path', () => {
    return app.getPath('userData');
});
