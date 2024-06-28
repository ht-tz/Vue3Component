module.exports = {
	// 使 eslint 支持 node 与 ES6
	env: {
		browser: true,
		es2021: true,
		node: true
	},
	// 引入推荐的语法校验规则
	extends: [
		'eslint:recommended',
		'plugin:vue/vue3-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended'
	],
	settings: {
		// 这个配置是用于指定模块导入解析器的配置，主要用于告诉 ESLint 如何解析模块导入语句
		'import/resolver': {
			// node：指定了使用 Node.js 解析模块导入语句的配置。在这里，配置了支持的文件扩展名，包括 .tsx、.ts、.js 和 .json。
			node: {
				extensions: ['.tsx', '.ts', '.js', '.json']
			},
			// typescript：指定了使用 TypeScript 解析模块导入语句的配置。这个配置为空对象，表示使用默认配置。
			typescript: {}
		}
	},

	overrides: [
		// 检测ts和tsx，注意files要包括文件，否则会报错
		{
			files: ['./src/**/*.ts', './src/*.ts', './src/**/*.tsx'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				sourceType: 'module',
				project: './tsconfig.json' // 指定 TypeScript 配置文件
			}
		}
	],
	/*
     这里一定要配置对 先使用vue-eslint-parser 再使用@typescript-eslint/parser
     先解析 <template> 标签中的内容 然后再解析 vue <script> 标签中的 TS 代码
     */
	// 选择使用的解析器
	parser: 'vue-eslint-parser',
	// 解析器的详细配置
	parserOptions: {
		// 使用最新版 ES 语法
		ecmaVersion: 'latest',
		// 使用 ESLint TS 解析器
		parser: '@typescript-eslint/parser',
		// 使用 ES 模块化规范
		sourceType: 'module'
	},
	// 使用的插件
	plugins: ['vue', '@typescript-eslint'],
	// 自定义规则
	rules: { 'prettier/prettier': 'error' }
};
