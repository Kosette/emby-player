# Emby桌面播放器 - macOS构建指南

## 前提条件

- macOS操作系统
- Node.js环境
- 已克隆的Emby桌面播放器源代码

## 构建步骤

### 1. 配置package.json

首先在`package.json`中添加macOS构建配置：

```json
"scripts": {
  "electron:build:mac": "cross-env NODE_ENV=production tsc --noEmit false || cross-env NODE_ENV=production vite build && electron-builder --mac"
},
"build": {
  "appId": "com.emby.desktopplayer",
  "productName": "Emby Desktop Player",
  "directories": {
    "output": "dist_electron"
  },
  "files": [
    "dist/**/*",
    "main.js",
    "preload.js",
    "node_modules/**/*"
  ],
  "extraResources": [
    "dist"
  ],
  "mac": {
    "category": "public.app-category.entertainment",
    "target": ["dmg", "zip"],
    "icon": "public/icon.icns"
  }
}
```

### 2. 准备应用图标

需要创建macOS格式的图标文件(.icns)：

```bash
# 创建图标集文件夹
mkdir -p public/icon.iconset

# 复制现有图标到不同尺寸
cp src/assets/emby_icon_32x32.png public/icon.iconset/icon_16x16@2x.png
cp src/assets/emby_icon_32x32.png public/icon.iconset/icon_32x32.png
cp src/assets/emby_icon_64x64.png public/icon.iconset/icon_32x32@2x.png
cp src/assets/emby_icon_64x64.png public/icon.iconset/icon_64x64.png
cp src/assets/emby_icon_128x128.png public/icon.iconset/icon_64x64@2x.png
cp src/assets/emby_icon_128x128.png public/icon.iconset/icon_128x128.png
cp src/assets/emby_icon_256x256.png public/icon.iconset/icon_128x128@2x.png
cp src/assets/emby_icon_256x256.png public/icon.iconset/icon_256x256.png
cp src/assets/emby_icon_512x512.png public/icon.iconset/icon_256x256@2x.png
cp src/assets/emby_icon_512x512.png public/icon.iconset/icon_512x512.png

# 使用macOS的iconutil工具生成.icns文件
iconutil -c icns public/icon.iconset -o public/icon.icns
```

### 3. 确保正确加载生产环境构建

为了避免打包后的应用尝试连接开发服务器而导致错误，需要修改`main.js`文件中的加载逻辑：

```javascript
// 修改main.js文件，添加以下代码到createWindow函数中
// 添加处理打包应用的逻辑
const fs = require('fs');

// 记录当前环境和应用路径信息以便调试
console.log('当前环境:', process.env.NODE_ENV);
console.log('应用路径:', __dirname);
console.log('是否为打包环境:', app.isPackaged);

// 在生产环境加载静态文件部分替换为以下代码
if (process.env.NODE_ENV !== 'development') {
  // 生产环境加载打包好的文件
  try {
    // 处理不同的文件路径情况
    let indexPath;
    
    // 检查在打包应用中的可能路径
    if (app.isPackaged) {
      // 打包后的应用中，查找可能的路径
      const possiblePaths = [
        path.join(__dirname, 'dist/index.html'),
        path.join(__dirname, '../dist/index.html'),
        path.join(__dirname, '../../dist/index.html'),
        path.join(__dirname, './dist/index.html'),
        path.join(__dirname, 'dist/renderer/index.html'),
        path.join(__dirname, '../dist/renderer/index.html'),
        path.join(process.resourcesPath, 'dist/index.html'),
        path.join(process.resourcesPath, 'app/dist/index.html'),
        path.join(process.resourcesPath, 'app/dist/renderer/index.html')
      ];
      
      // 查找第一个存在的路径
      for (const p of possiblePaths) {
        console.log('检查路径:', p);
        if (fs.existsSync(p)) {
          indexPath = p;
          console.log('找到索引文件:', indexPath);
          break;
        }
      }
      
      if (!indexPath) {
        console.error('未找到索引文件，尝试使用默认路径');
        indexPath = path.join(__dirname, 'dist/index.html');
      }
    } else {
      // 非打包环境(npm start)
      indexPath = path.join(__dirname, 'dist/index.html');
    }
    
    console.log('最终加载路径:', indexPath);
    mainWindow.loadFile(indexPath);
  } catch (err) {
    console.error('加载生产环境文件失败:', err);
    // 显示错误信息
  }
}

// 在 main.js 中
app.on('ready', () => {
  console.log('应用数据路径:', app.getPath('userData'));
  console.log('当前工作目录:', process.cwd());
});
```

### 4. 执行构建命令

运行以下命令开始构建：

```bash
npm run electron:build:mac
```

此命令会执行以下操作：
- 设置NODE_ENV=production环境变量
- 跳过TypeScript类型检查
- 使用Vite构建项目
- 使用electron-builder打包macOS应用

## 构建macOS通用版本和Windows版本

### 1. 构建macOS通用版本 (同时支持Intel和Apple芯片)

1. 添加通用版本构建命令到package.json

```bash
# 添加macOS通用版本构建命令
npm pkg set scripts.electron:build:mac:universal="cross-env NODE_ENV=production tsc --noEmit false || cross-env NODE_ENV=production vite build && electron-builder --mac --universal"
```

2. 执行构建命令

```bash
npm run electron:build:mac:universal
```

构建完成后，将在dist_electron目录下生成：
- `Emby Desktop Player-1.0.0-universal.dmg` - 通用安装包
- `Emby Desktop Player-1.0.0-universal-mac.zip` - 通用便携版

### 2. 构建Windows版本

1. 准备Windows图标

```bash
# 创建图标目录
mkdir -p public/icons
cp src/assets/emby_icon_256x256.png public/icons/icon.png
```

2. 在package.json中添加Windows构建配置

```bash
# 添加Windows构建命令
npm pkg set scripts.electron:build:win="cross-env NODE_ENV=production tsc --noEmit false || cross-env NODE_ENV=production vite build && electron-builder --win"

# 设置Windows构建配置
npm pkg set build.win.icon="public/icons/icon.png"
npm pkg set "build.win.target[0]"="nsis"
npm pkg set "build.win.target[1]"="portable"
```

3. 如果在macOS上构建Windows版本，需要安装wine和mono

```bash
brew install wine mono
```

4. 执行Windows构建命令

```bash
npm run electron:build:win
```

构建完成后，在dist_electron目录下会生成：
- `Emby Desktop Player Setup 1.0.0.exe` - Windows安装程序
- `Emby Desktop Player 1.0.0.exe` - Windows便携版

### 3. 一次性构建所有平台版本

如果需要同时构建多个平台的应用：

```bash
# 添加多平台构建命令
npm pkg set scripts.electron:build:all="cross-env NODE_ENV=production tsc --noEmit false || cross-env NODE_ENV=production vite build && electron-builder --mac --win"

# 执行多平台构建
npm run electron:build:all
```

## 构建结果

成功构建后，在`dist_electron`目录下可以找到以下文件：
- `Emby Desktop Player-1.0.0-arm64.dmg` - macOS ARM安装包
- `Emby Desktop Player-1.0.0-arm64-mac.zip` - macOS ARM便携版
- `Emby Desktop Player-1.0.0-universal.dmg` - macOS通用安装包
- `Emby Desktop Player-1.0.0-universal-mac.zip` - macOS通用便携版
- `Emby Desktop Player Setup 1.0.0.exe` - Windows安装程序
- `Emby Desktop Player 1.0.0.exe` - Windows便携版

## 安装与使用

1. **使用DMG安装**：
   - 双击`.dmg`文件打开
   - 将应用拖到Applications文件夹
   - 从应用程序文件夹启动应用

2. **使用ZIP文件**：
   - 解压`.zip`文件
   - 直接运行解压出的应用

3. **使用Windows安装程序**：
   - 双击Setup安装程序
   - 按照安装向导操作
   - 从开始菜单启动应用

4. **使用Windows便携版**：
   - 直接双击便携版EXE文件运行

## 注意事项

1. **应用未签名**：
   - 首次运行时系统可能显示"无法验证开发者"警告
   - 需在"系统偏好设置→安全性与隐私"中选择"仍要打开"
   - Windows用户可能需要允许"未知发布者"的应用运行

2. **代码签名**：
   - 当前构建未签名，仅适合个人使用
   - 若需分发，建议申请Apple开发者账号和Microsoft开发者账号进行签名

3. **架构支持**：
   - macOS ARM版本仅适用于M系列芯片的Mac
   - macOS通用版本支持Intel和M系列芯片的Mac
   - Windows版本支持x64和ARM架构的Windows系统

## 问题排查

1. **TypeScript错误**：
   - 构建脚本使用了`|| vite build`来忽略TypeScript错误
   - 正式发布前建议修复这些警告和错误

2. **图标问题**：
   - 若应用图标不显示，检查`icon.icns`文件是否正确生成
   - 确保package.json中的图标路径正确

3. **启动错误修复**：
   如果遇到"加载失败"错误（通常显示"无法连接到开发服务器"或"ERR_FILE_NOT_FOUND"），可能是以下原因：
   
   - **问题原因**：
     - 应用程序在生产环境仍尝试连接开发服务器
     - 打包后的应用无法找到正确的index.html路径
     - NODE_ENV环境变量未正确设置
   
   - **解决方法**：
     1. 确保在package.json中正确设置环境变量：
        ```json
        "electron:build:mac": "cross-env NODE_ENV=production tsc --noEmit false || cross-env NODE_ENV=production vite build && electron-builder --mac"
        ```
     
     2. 确保配置正确的文件包含规则：
        ```json
        "files": [
          "dist/**/*",
          "main.js",
          "preload.js",
          "node_modules/**/*"
        ],
        "extraResources": [
          "dist"
        ]
        ```
     
     3. 确保main.js中包含智能路径检测逻辑（见上文第3步）
     
     4. 重新打包并测试应用

4. **调试打包应用**：
   - 打开终端并运行：`/Applications/Emby\ Desktop\ Player.app/Contents/MacOS/Emby\ Desktop\ Player`
   - 查看控制台输出，了解潜在的问题
   - 检查生成的app.asar文件内容：`npx asar extract /Applications/Emby\ Desktop\ Player.app/Contents/Resources/app.asar extracted` 