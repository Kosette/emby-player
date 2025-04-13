# Installation Guide / 安装指南

[English](#english) | [中文](#chinese)

<a id="english"></a>
## Installation Guide for Emby Desktop Player

This guide will help you install and set up the Emby Desktop Player on your system.

### Prerequisites

- Node.js (v14 or newer)
- npm (v6 or newer)
- Git

### Installation Steps

#### Method 1: Using Pre-built Binaries

1. Go to the [Releases](https://github.com/yourusername/emby-desktop-player/releases) page
2. Download the appropriate installer for your operating system:
   - Windows: `.exe` installer
   - macOS: `.dmg` file
   - Linux: `.AppImage` or `.deb` package
3. Run the installer or package to install the application

#### Method 2: Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/emby-desktop-player.git
   ```

2. Navigate to the project directory:
   ```bash
   cd emby-desktop-player
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the application:
   ```bash
   npm run electron:build
   ```

5. The built application will be available in the `dist` directory

### First-time Setup

1. Launch the Emby Desktop Player
2. Enter your Emby server address (e.g., `http://your-emby-server:8096` or `https://your-emby-server`)
3. Log in with your Emby account credentials
4. You're all set! You can now browse and play your media

### Troubleshooting

- If you encounter issues connecting to your Emby server, ensure your server address is correct and your server is online
- For playback issues, check if your media format is supported
- If the application fails to start, try reinstalling or building from source

<a id="chinese"></a>
## Emby 桌面播放器安装指南

本指南将帮助您在系统上安装和设置 Emby 桌面播放器。

### 前提条件

- Node.js (v14 或更新版本)
- npm (v6 或更新版本)
- Git

### 安装步骤

#### 方法一：使用预构建二进制文件

1. 前往[发布页面](https://github.com/yourusername/emby-desktop-player/releases)
2. 下载适合您操作系统的安装程序：
   - Windows: `.exe` 安装程序
   - macOS: `.dmg` 文件
   - Linux: `.AppImage` 或 `.deb` 包
3. 运行安装程序或包以安装应用程序

#### 方法二：从源代码构建

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/emby-desktop-player.git
   ```

2. 导航到项目目录：
   ```bash
   cd emby-desktop-player
   ```

3. 安装依赖：
   ```bash
   npm install
   ```

4. 构建应用程序：
   ```bash
   npm run electron:build
   ```

5. 构建好的应用程序将在 `dist` 目录中可用

### 首次设置

1. 启动 Emby 桌面播放器
2. 输入您的 Emby 服务器地址（例如 `http://your-emby-server:8096` 或 `https://your-emby-server`）
3. 使用您的 Emby 账户凭据登录
4. 一切就绪！您现在可以浏览和播放您的媒体了

### 故障排除

- 如果您在连接到 Emby 服务器时遇到问题，请确保您的服务器地址正确且您的服务器在线
- 对于播放问题，请检查您的媒体格式是否受支持
- 如果应用程序无法启动，请尝试重新安装或从源代码构建 