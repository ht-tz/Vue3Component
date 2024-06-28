/*
 * @Author: htz
 * @Date: 2024-06-27 16:10:12
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2024-06-28 12:48:43
 * @Description:  vite配置
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// import ViteCompression from 'vite-plugin-compression';
import brotli from 'rollup-plugin-brotli';
import { fileURLToPath } from 'url';
import { manualChunksPlugin } from 'vite-plugin-webpackchunkname';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		brotli({}), // br压缩的算法， 比gzip更有优势
		manualChunksPlugin()
	],
	css: {
		// css预=处理器
		preprocessorOptions: {
			less: {
				javascriptEnabled: true // 允许js语法
			}
		}
	},
	build: {
		sourcemap: false,
		// 默认是五百
		chunkSizeWarningLimit: 400,

		rollupOptions: {
			//打包入口文件
			input: {
				index: fileURLToPath(new URL('./index.html', import.meta.url))
			},
			output: {
				chunkFileNames: 'static/js/[name]-[hash].js',
				entryFileNames: 'static/js/[name]-[hash].js',
				assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
			}
		},
		// 打包后是否压缩
		minify: 'terser'
	},
	// 配置别名
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'#': fileURLToPath(new URL('./types', import.meta.url))
		}
	}
});
