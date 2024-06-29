<template>
	<div class="container-list">
		<dynamitic></dynamitic>
	</div>
</template>
<script setup>
// import { ref } from 'vue';
import dynamitic from '../view/dynamtic-list.vue';

// const listData = ref([]);
// for (let i = 0; i < 10000; i++) {
// 	listData.value.push({
// 		id: i.toString(),
// 		name: `测试数据${i}`
// 	});
// }
// console.log(listData.value);
</script>

<style lang="less" scoped>
.container-list {
	position: relative;
	margin: 0 auto;
	width: 800px;
	height: 800px;
	text-align: center;
}
</style>
