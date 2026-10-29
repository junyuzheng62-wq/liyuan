import {defineConfig} from 'vite';
export default defineConfig({base:'/liyuan/',build:{rollupOptions:{input:{main:'index.html',graybox:'graybox/index.html'}}}});
