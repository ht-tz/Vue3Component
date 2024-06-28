import { createWebHistory, createRouter } from 'vue-router';

const routes = [
	{
		path: '/home',
		name: 'home',
		title: '首页',
		component: () => import('@/components/virtualList/container/hw-cm.vue')
	},
	{
		path: '/ex',
		name: 'ex',
		title: '不定高虚拟列表',
		component: () => import('@/components/virtualList/container/example-ex.vue')
	}
];

const router = createRouter({
	history: createWebHistory(),
	routes
});

export default router;
