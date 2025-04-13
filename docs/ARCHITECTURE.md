# Architecture Design / 架构设计

[English](#english) | [中文](#chinese)

<a id="english"></a>
## Emby Desktop Player Architecture

This document describes the architecture and technical design of the Emby Desktop Player application.

### Overview

Emby Desktop Player is built on Electron and React, providing a cross-platform desktop experience for Emby media server users. The application follows a modern architecture that separates concerns between the main process (Electron backend) and renderer process (React frontend).

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Emby Desktop Player                    │
│                                                         │
│  ┌───────────────┐           ┌─────────────────────┐   │
│  │               │           │                     │   │
│  │  Main Process │◄─────────►│  Renderer Process   │   │
│  │  (Electron)   │   IPC     │  (React)            │   │
│  │               │           │                     │   │
│  └───────────────┘           └─────────────────────┘   │
│                                       │                 │
│                                       ▼                 │
│                              ┌─────────────────────┐   │
│                              │                     │   │
│                              │  Emby Server API    │   │
│                              │                     │   │
│                              └─────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Detailed Component Interaction

The following diagram illustrates the detailed interaction between components:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─────────────────────────────────┐        ┌───────────────────────────┐   │
│  │         Main Process            │        │      Renderer Process     │   │
│  │                                 │        │                           │   │
│  │  ┌─────────────┐ ┌───────────┐ │        │ ┌─────────┐  ┌─────────┐  │   │
│  │  │ Window Mgmt │ │ App       │ │        │ │  React  │  │  Stores │  │   │
│  │  │             │ │ Lifecycle │ │        │ │  UI     │◄─┤         │  │   │
│  │  └─────────────┘ └───────────┘ │        │ │ Components│ │ Zustand │  │   │
│  │         │              │       │        │ └────┬────┘  └────┬────┘  │   │
│  │         └──────────────┘       │        │      │            │       │   │
│  │               │                │        │      └────────────┘       │   │
│  │         ┌─────┴─────┐          │        │             │             │   │
│  │         │  IPC      │◄─────────┼────────┼─────────────┘             │   │
│  │         │  Bridge   │          │        │                           │   │
│  │         └─────┬─────┘          │        │                           │   │
│  │               │                │        │      ┌───────────────┐    │   │
│  └───────────────┼────────────────┘        │      │ Media Players │    │   │
│                  │                         │      │               │    │   │
│                  │                         │      │ ┌───────────┐ │    │   │
│                  │                         │      │ │  HLS.js   │ │    │   │
│                  │                         │      │ └───────────┘ │    │   │
│                  │                         │      │ ┌───────────┐ │    │   │
│                  │                         │      │ │ Video.js  │ │    │   │
│                  │                         │      │ └───────────┘ │    │   │
│                  │                         │      └───────┬───────┘    │   │
│                  │                         │              │            │   │
│                  │                         └──────────────┼────────────┘   │
│                  │                                        │                │
│                  │                                        │                │
│                  │                          ┌─────────────▼──────────────┐ │
│                  └──────────────────────────►                            │ │
│                                             │      Emby Server API       │ │
│                                             │                            │ │
│                                             └────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Main Process (Electron)

The main process is responsible for:
- Native desktop integration
- Window management
- Application lifecycle
- System-level features
- Inter-process communication (IPC)

Key files:
- `main.js` - Entry point for the Electron application
- `preload.js` - Preload script for secure IPC between processes

#### 2. Renderer Process (React)

The renderer process is a React application that provides the user interface and handles:
- User interactions
- Media playback
- State management
- API communication
- Rendering UI components

Structure:
- `src/renderer/` - React application root
  - `components/` - Reusable UI components
  - `pages/` - Full page components (Home, Player, Settings, etc.)
  - `stores/` - Zustand state management stores
  - `styles/` - CSS/SCSS styling files

#### 3. State Management

The application uses Zustand for state management with separate stores for different concerns:
- `embyStore.ts` - Manages Emby server connection and authentication
- `mediaLibraryStore.ts` - Handles media library data
- `serverStore.ts` - Manages server connection settings

#### 4. Media Playback

Media playback is handled through:
- HLS.js for HTTP Live Streaming content
- Video.js for video playback and controls
- Custom player interface in `Player.tsx`

#### 5. API Integration

The application communicates with Emby servers through:
- REST API calls for metadata and authentication
- Streaming endpoints for media content

### Data Flow

1. User authenticates with Emby server
2. Application fetches library and media metadata
3. User browses content through the interface
4. When media is selected, the player fetches and plays the content

### Technology Stack

- **Frontend**: React, TypeScript, Ant Design
- **State Management**: Zustand
- **Media Playback**: HLS.js, Video.js
- **Backend**: Electron
- **Build Tools**: Vite, Electron Builder
- **Styling**: SCSS/CSS

### Design Decisions

1. **Electron for Cross-Platform Support**  
   Using Electron allows the application to run on Windows, macOS, and Linux with minimal platform-specific code.

2. **React for UI**  
   React provides a component-based architecture that makes it easier to build and maintain a complex UI.

3. **Zustand for State Management**  
   Zustand provides a lightweight and flexible state management solution that is simpler than Redux while still powerful.

4. **HLS.js for Streaming**  
   HLS.js provides support for HTTP Live Streaming, which is commonly used by Emby servers.

5. **TypeScript for Type Safety**  
   TypeScript adds static typing to improve code quality and developer experience.

<a id="chinese"></a>
## Emby 桌面播放器架构

本文档描述了 Emby 桌面播放器应用程序的架构和技术设计。

### 概述

Emby 桌面播放器基于 Electron 和 React 构建，为 Emby 媒体服务器用户提供跨平台的桌面体验。该应用程序遵循现代架构，将主进程（Electron 后端）和渲染进程（React 前端）之间的关注点分离。

### 高级架构

```
┌─────────────────────────────────────────────────────────┐
│                  Emby 桌面播放器                         │
│                                                         │
│  ┌───────────────┐           ┌─────────────────────┐   │
│  │               │           │                     │   │
│  │  主进程       │◄─────────►│  渲染进程           │   │
│  │  (Electron)   │   IPC     │  (React)            │   │
│  │               │           │                     │   │
│  └───────────────┘           └─────────────────────┘   │
│                                       │                 │
│                                       ▼                 │
│                              ┌─────────────────────┐   │
│                              │                     │   │
│                              │  Emby 服务器 API    │   │
│                              │                     │   │
│                              └─────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 详细组件交互

以下图表说明了组件之间的详细交互：

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─────────────────────────────────┐        ┌───────────────────────────┐   │
│  │         主进程                  │        │      渲染进程              │   │
│  │                                 │        │                           │   │
│  │  ┌─────────────┐ ┌───────────┐ │        │ ┌─────────┐  ┌─────────┐  │   │
│  │  │ 窗口管理    │ │ 应用      │ │        │ │  React  │  │  状态    │  │   │
│  │  │             │ │ 生命周期  │ │        │ │  UI     │◄─┤         │  │   │
│  │  └─────────────┘ └───────────┘ │        │ │ 组件    │  │ Zustand │  │   │
│  │         │              │       │        │ └────┬────┘  └────┬────┘  │   │
│  │         └──────────────┘       │        │      │            │       │   │
│  │               │                │        │      └────────────┘       │   │
│  │         ┌─────┴─────┐          │        │             │             │   │
│  │         │  IPC      │◄─────────┼────────┼─────────────┘             │   │
│  │         │  桥接     │          │        │                           │   │
│  │         └─────┬─────┘          │        │                           │   │
│  │               │                │        │      ┌───────────────┐    │   │
│  └───────────────┼────────────────┘        │      │ 媒体播放器    │    │   │
│                  │                         │      │               │    │   │
│                  │                         │      │ ┌───────────┐ │    │   │
│                  │                         │      │ │  HLS.js   │ │    │   │
│                  │                         │      │ └───────────┘ │    │   │
│                  │                         │      │ ┌───────────┐ │    │   │
│                  │                         │      │ │ Video.js  │ │    │   │
│                  │                         │      │ └───────────┘ │    │   │
│                  │                         │      └───────┬───────┘    │   │
│                  │                         │              │            │   │
│                  │                         └──────────────┼────────────┘   │
│                  │                                        │                │
│                  │                                        │                │
│                  │                          ┌─────────────▼──────────────┐ │
│                  └──────────────────────────►                            │ │
│                                             │      Emby 服务器 API       │ │
│                                             │                            │ │
│                                             └────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 组件细分

#### 1. 主进程 (Electron)

主进程负责：
- 原生桌面集成
- 窗口管理
- 应用程序生命周期
- 系统级功能
- 进程间通信 (IPC)

关键文件：
- `main.js` - Electron 应用程序的入口点
- `preload.js` - 进程之间安全 IPC 的预加载脚本

#### 2. 渲染进程 (React)

渲染进程是提供用户界面并处理以下内容的 React 应用程序：
- 用户交互
- 媒体播放
- 状态管理
- API 通信
- 渲染 UI 组件

结构：
- `src/renderer/` - React 应用程序根目录
  - `components/` - 可重用 UI 组件
  - `pages/` - 完整页面组件（首页、播放器、设置等）
  - `stores/` - Zustand 状态管理存储
  - `styles/` - CSS/SCSS 样式文件

#### 3. 状态管理

应用程序使用 Zustand 进行状态管理，为不同关注点设置单独的存储：
- `embyStore.ts` - 管理 Emby 服务器连接和认证
- `mediaLibraryStore.ts` - 处理媒体库数据
- `serverStore.ts` - 管理服务器连接设置

#### 4. 媒体播放

媒体播放通过以下方式处理：
- HLS.js 用于 HTTP 实时流内容
- Video.js 用于视频播放和控制
- `Player.tsx` 中的自定义播放器界面

#### 5. API 集成

应用程序通过以下方式与 Emby 服务器通信：
- REST API 调用用于元数据和认证
- 流媒体端点用于媒体内容

### 数据流

1. 用户通过 Emby 服务器进行认证
2. 应用程序获取库和媒体元数据
3. 用户通过界面浏览内容
4. 选择媒体后，播放器获取并播放内容

### 技术栈

- **前端**：React、TypeScript、Ant Design
- **状态管理**：Zustand
- **媒体播放**：HLS.js、Video.js
- **后端**：Electron
- **构建工具**：Vite、Electron Builder
- **样式**：SCSS/CSS

### 设计决策

1. **使用 Electron 实现跨平台支持**  
   使用 Electron 允许应用程序在 Windows、macOS 和 Linux 上运行，并且平台特定代码最少。

2. **使用 React 构建 UI**  
   React 提供了基于组件的架构，使构建和维护复杂 UI 变得更容易。

3. **使用 Zustand 进行状态管理**  
   Zustand 提供了一个轻量级且灵活的状态管理解决方案，比 Redux 更简单但仍然强大。

4. **使用 HLS.js 进行流媒体播放**  
   HLS.js 提供对 HTTP 实时流的支持，这是 Emby 服务器常用的协议。

5. **使用 TypeScript 确保类型安全**  
   TypeScript 添加静态类型检查以提高代码质量和开发者体验。 