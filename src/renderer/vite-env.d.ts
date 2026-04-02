/// <reference types="vite/client" />

interface Window {
  electronAPI: typeof import('../preload/index').electronAPI;
}
