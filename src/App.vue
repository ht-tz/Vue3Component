<template>
	<div class="content">
		<div class="aside">
			<div class="menu">
				<div v-for="(item, index) in menus" :key="item.id + index" class="menu-item" @click="menuClick(item)">
					<span class="name">{{ item.name }}</span>
				</div>
			</div>
		</div>
		<div class="main">
			<router-view></router-view>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const menus = ref([]);

const router = useRouter();
menus.value = [
	{
		name: '简单虚拟列表',
		id: 1,
		path: '/home'
	},
	{
		name: '不定高虚拟列表',
		id: 2,
		path: '/ex'
	}
];

function menuClick(item) {
	const path = item.path;
	router.push(path);
}
</script>
<style lang="less" scoped>
.content {
	display: flex;
	overflow: hidden;
	width: 100%;
	height: 100vh;

	.aside {
		position: relative;
		width: 240px;
		height: 100%;
		border-right: 1px solid #ccc;

		.menu {
			position: absolute;
			width: 100%;
			height: 100%;

			.menu-item {
				width: 100%;
				height: 48px;
				font-size: 18px;
				text-align: center;
				font-weight: 600;
				line-height: 30px;
				cursor: pointer;

				&:hover {
					background-color: burlywood;
				}
			}
		}
	}

	.main {
		margin: 0 36px;
		width: calc(100% - 240px);
	}
}
</style>
