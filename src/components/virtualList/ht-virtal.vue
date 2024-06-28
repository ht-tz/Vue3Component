<template>
	<div class="outContainer">
		<!-- 支持滚动条的容器，定义整个虚拟列表的高度 -->
		<div ref="scrollerContainerRef" class="scrollerContainer" @scroll="onScroll">
			<div class="pillarDom" :style="{ height: `${pillDomHeight}px` }"></div>
			<div class="contentList" :style="styleTranlate">
				<div v-for="item in currentPageData" :key="item.key" class="item">{{ item.name || '--' }}</div>
				<div v-if="dataLoading" class="loadingDiv">数据加载中...</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRefs } from 'vue';

const props = withDefaults(
	defineProps<{
		itemHeight?: number;
	}>(),
	{
		itemHeight: 100
	}
);

type Item = {
	name: string;
	key: string;
};

//all  data
const allData = ref<Item[]>([]);

let allCount = 0;
//  generator listData
const loadData = (count: number = 100) => {
	return new Promise((resolve) => {
		console.log('数据加加载中...');
		const listData: Item[] = [];
		if (allCount < 500) {
			let sidx = allCount;
			allCount += count;
			for (let i = sidx; i < allCount; i++) {
				listData.push({
					name: `第${i}条列表数据`,
					key: i.toString()
				});
			}
		}
		setTimeout(() => {
			console.log('数据加载完毕');
			resolve(listData);
		}, 2000);
	});
};

//内容的y轴位移，当渲染区域 难道第一个元素，完全位移到视野之外的时候，需要重新计算startOffset，将第一个元素移动回可见区域
const startOffset = ref<number>(0);

//位移量
const styleTranlate = computed(() => {
	return `transform: translateY(${startOffset.value}px)`;
});
const { itemHeight } = toRefs(props);
// 计=计算滚动区域的总高度
const pillDomHeight = computed(() => {
	return itemHeight.value * allData.value.length;
});
//开始
const start = ref<number>(0);
//结束
const end = computed(() => {
	return start.value + pageItemCount.value;
});

// current page data
const currentPageData = computed(() => {
	// 前面多缓冲一屏幕，避免滚动到顶部的时候，数组下标小雨零
	let realStart = Math.max(0, start.value - pageItemCount.value);
	// avoid array  cover last
	const realEnd = Math.min(end.value + pageItemCount.value, allData.value.length);
	console.log(realEnd, '真实结束');
	return allData.value.slice(realStart, realEnd);
});

//滚动的容器，支持显示的滚动条的容器，确定虚拟列表的可视区域高度
const scrollerContainerRef = ref<HTMLDivElement | null>(null);

// 董动态获取容器的高度，采用计算属性的方式获取滚动容器的高度
const scrollerContainerHeight = computed(() => {
	return scrollerContainerRef.value ? scrollerContainerRef.value.offsetHeight : 0;
});

/**
 * 视口显示的数据量：  滚动容器的高度/每一项的高度  结果向上取整，+1
 *
 * 为什么向上取整？
 * 因为如果向下取整，那么当滚动条滚动到最底部的时候，最后一行数据会显示不全
 *
 * 为什最后需要 + 1
 * 为什么最后还要+1？
 * 如：页面高度100px，单个元素30px，根据向上取整的方式，我们已经将这个视口渲染出了4个元素，第4个元素只有10px在视口中，剩余20px在视口之外。
 * 如果此时我们拖动滚动条，拖动25px，此时第一个元素尚未完全移出视口，最后一个元素完全进入了视口，且还有5px空白。按照通常的想法，这里应该显示第5个元素的一小部分才对。
 * 因此，最后还需要+1，让最后一个元素完全进入视口
 *
 */

const pageItemCount = computed(() => {
	return Math.ceil(scrollerContainerHeight.value / itemHeight.value) + 1;
});

// 监听数据因为滚动而发生变化
function onScroll(evt: UIEvent): void {
	// 出发滚动事件的元素
	const scrollDom = evt.target as HTMLDivElement;
	if (!scrollDom) return;
	//获取滚动的距离
	const { scrollTop, scrollHeight, clientHeight } = scrollDom;
	// 计算当前可视区域中第一个元素在数据中的索引
	start.value = Math.floor(scrollTop / itemHeight.value);
	console.log(start.value, '滚动计算数据索引');

	// 根据缓冲区来计算索引的高度
	let realStart = Math.max(0, start.value - pageItemCount.value);

	// 计算当前可视区域中第一个元素距离视口顶部的距离, 更新y轴移动的高度
	startOffset.value = realStart * itemHeight.value;
	console.log(startOffset.value, '滚动计算数据索引');

	// 计算看有没有到底
	appendData(scrollTop, scrollHeight, clientHeight);
}
/***************************** 加入加载更多的逻辑 *******************************/
const dataLoading = ref<boolean>(false);
const hasMoreData = ref<boolean>(true);

/**
 * 判断是否滚动到了底部
 */

function isScrollToBottom(scrollTop: number, scrollHeight: number, clientHeight: number) {
	// Math.abs(scrollHeight - clientHeight - scrollTop) < 1 : 判断滚动条是否滚动到了最底部。公式来自MDN
	// return Math.abs(scrollHeight - clientHeight - scrollTop) < 1
	/*
  上面公式可以判断完全滚动到了最底部，实际更人性化的方式是，接近底部的时候就开始加载数据，让用户在无感知的情况下就加载了后续数据，因此可以将1调整到一个适合你项目的值
   */
	let data = Math.abs(scrollHeight - clientHeight - scrollTop);
	console.log('距离距离', data, data < 800);

	return data < 800;
}

//模拟滚动下拉
async function appendData(scrollTop: number, scrollHeight: number, clientHeight: number) {
	let isToBottom = isScrollToBottom(scrollTop, scrollHeight, clientHeight);
	if (!dataLoading.value && hasMoreData.value && isToBottom) {
		dataLoading.value = true;
		try {
			const dataList = (await loadData()) as Item[];
			if (dataList && dataList.length > 0) {
				allData.value.push(...dataList);
				hasMoreData.value = true;
			} else {
				//这里判断下次滚动到底部是否还有数据可加载，是根据最后一次请求的请求结果是否有数据来判断的，实际不应该这么做，
				//因为这会导致多发一次请求。更好的方式应该是每个请求结果中都包含一个字段用于告知前端是否还能请求后端来获取更多数据。
				hasMoreData.value = false;
			}
		} finally {
			dataLoading.value = false;
		}
	}
}

async function init() {
	allData.value = (await loadData()) as Item[];
}

// 模拟后端获取数据
onMounted(() => {
	init();
});
</script>

<style lang="less" scoped>
.outContainer {
  width: 100%;
  height: 100%;
}

.scrollerContainer {
  position: relative;
  overflow: auto;
  width: 100%;
  height: 100%;
  -webkit-overflow-scrolling: touch;
}

.plildDom {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;
}

.contentList {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
}

.item {
  height: calc(v-bind(itemHeight) * 1px);
  line-height: calc(v-bind(itemHeight) * 1px);
  text-align: center;
  border-bottom: 1px solid #ccc;
  // 避免超出设置的高度
  box-sizing: border-box;

  &:nth-child(odd) {
    background-color: aqua;
  }

  &:nth-child(even) {
    background-color: #96d57d;
  }

  &:last-child {
    border-bottom: none;
  }
}

.loadingDiv {
  width: 100%;
  height: 100px;
  text-align: center;
  color: red;
  font-weight: bold;
}
</style>
