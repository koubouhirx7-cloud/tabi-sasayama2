import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stay: resolve(__dirname, 'stay.html'),
        stayDetail: resolve(__dirname, 'stay-detail.html'),
        news: resolve(__dirname, 'news.html'),
        newsDetail: resolve(__dirname, 'news-detail.html'),
        about: resolve(__dirname, 'about.html'),
        education: resolve(__dirname, 'education.html'),
        inbound: resolve(__dirname, 'inbound.html'),
        download: resolve(__dirname, 'download.html'),
        company: resolve(__dirname, 'company.html'),
        contact: resolve(__dirname, 'contact.html'),
        stayApply: resolve(__dirname, 'stay-apply.html'),
        adminMenu: resolve(__dirname, 'admin-menu.html'),
        adminNews: resolve(__dirname, 'admin-news.html'),
        adminStay: resolve(__dirname, 'admin-stay.html'),
        adminVoices: resolve(__dirname, 'admin-voices.html'),
        voices: resolve(__dirname, 'voices.html'),
        customize: resolve(__dirname, 'customize.html'),
      }
    }
  }
});
