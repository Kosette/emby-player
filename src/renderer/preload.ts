import { contextBridge, ipcRenderer } from 'electron';

// 暴露窗口控制API给渲染进程
contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
}); 