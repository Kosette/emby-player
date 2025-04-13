import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 配置Sass选项以解决遗留API警告
        sassOptions: {
          outputStyle: 'expanded',
          quietDeps: true, // 禁止依赖项输出警告
        },
        // 不使用additionalData，让各组件自己引入变量
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true, // 如果端口已被占用，则终止
    hmr: {
      overlay: false, // 禁用 HMR 错误覆盖
    },
    cors: true, // 启用 CORS
    proxy: {
      '/api': {
        target: 'http://localhost:8096',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'antd', 'axios', 'zustand']
  }
}); 