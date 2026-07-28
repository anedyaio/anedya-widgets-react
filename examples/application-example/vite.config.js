import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss()
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@base-ui/react"],
  },
  server: {
    fs: {
      // Allow Vite to fetch assets from the parent widget SDK directory
      allow: ['..'] 
    }
  }

})

