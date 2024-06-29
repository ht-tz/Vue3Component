<!--
 * @Author: htz
 * @Date: 2024-06-28 15:25:06
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2024-06-29 13:25:37
 * @Description: 不定高的虚拟列表
-->
<template>
	<!-- 实际开发中虚拟列表通常是位于某个dom容器下，并占满这个dom容器的整个高度，这里就是模拟这种情况 -->
	{{ pillarDomHeight }} |
	{{ contentListOffset }}
	<div class="outContainer">
		<!-- scrollerContainer为支持滚动条的容器，定义整个虚拟列表的高度 -->
		<div ref="scrollerContainerRef" class="scrollerContainer" @scroll="onScroll">
			<div class="pillarDom" :style="{ height: `${pillarDomHeight}px` }"></div>
			<div ref="contentListRef" class="contentList" :style="styleTranslate">
				<div v-for="oneData in currenData" :key="oneData.id" class="item" :data-index="oneData.arrPos">
					<h6>{{ oneData.arrPos }} : {{ oneData.title }}</h6>
					<p>{{ oneData.content }}</p>
				</div>
				<div v-if="dataLoading" class="loadingDiv">数据加载中...</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ContentType, ContentPosition } from '../ts/index';
import { computed, markRaw, nextTick, onMounted, onUpdated, ref, toRefs } from 'vue';
import Mock from 'mockjs';

const props = withDefaults(
	defineProps<{
		cacheCount?: number;
	}>(),
	{
		cacheCount: 5
	}
);

const { cacheCount } = toRefs(props);

/**
 * 视口第一个元素底部位置与与视口顶部(scrollTop)的偏移量
 */
let startOffset = 0;
/**
 * 是否正在修正scrollTop位置
 */
let fixingScrollTop = false;
let lastScrollTop = 0;
/**
 * 是否向下滚动
 */
let isPositive = true;
/**
 * 预估每一条的高度，这里假设每一条的高度为100px
 */
const maxHeight = 100;

// all data
const allData = ref<ContentType[]>([]);

//位置信息
let positionDataArr: ContentPosition[] = [];

//撑开容器的高度
const pillarDomHeight = ref<number>(0);
// 内容列表的高度
const contentListRef = ref<HTMLDivElement>();
// 可是区域的高度
const scrollerContainerRef = ref<HTMLDivElement>();

// 滚送容器的高度
const scrollerContainerRefHeight = computed<number>(() => {
	return scrollerContainerRef.value ? scrollerContainerRef.value.offsetHeight : 0;
});

//开始索引位置
const startIndex = ref<number>(0);

//将视口最后一条数据在positionDataArr数组中索引的位置
const endIndex = computed(() => {
	if (!allData.value || allData.value?.length <= 0) return 0;
	// 将start作为allData开始的位置
	let endPos = startIndex.value;
	//	存放从startIndex开始的dom节点总高度
	let contentDomTotalHeight = positionDataArr[endPos].height;

	//视口高度 就是offsetHeight
	const viewPortHeight = scrollerContainerRefHeight.value;
	// 从startIndex开始 遍历 positionDataArr 统计数据dom节点的累积高度，直到超出视口高度
	while (contentDomTotalHeight < viewPortHeight) {
		endPos++;
		contentDomTotalHeight += positionDataArr[endPos].height;
	}
	// 因为数组的slice方法是包头不包尾的所以还需要再endPos上+1，才会是预期的元素数量
	endPos += 1;
	// 因为存在在某个元素位置开区间滚动的情况，此时该元素不会完全移出视口，
	//但又使得视口多出了位置，因此要再 + 1，渲染下一个元素来占满视口区域
	return endPos + 1;
});

// 内容Y轴的偏移量，当渲染区域的第一个元素移动到了可视窗口之外，需要重新计算偏移量
const contentListOffset = ref<number>(0);
// 向上移动的偏移量，就是startIndex*height
const styleTranslate = computed<string>(() => {
	return `transform:translate(0,${contentListOffset.value}px)`;
});
// 计算当前窗口所渲染的数据的
const currenData = computed<ContentType[]>(() => {
	//缓冲
	let cache = cacheCount.value;
	// 防止越界
	let realStart = Math.max(0, startIndex.value - cache);
	//避免数组越界
	const realEnd = Math.min(endIndex.value + cache, allData.value.length);
	// console.log(realEnd, startIndex.value, 'realEnd');
	let dataArr = allData.value.slice(realStart, realEnd);
	// console.log(dataArr, 'dataArr');
	return dataArr;
});

function loadData() {
	return new Promise<ContentType[]>((resolve) => {
		const data = Mock.mock({
			'list|100': [
				{
					// 属性 id 是一个自增数，起始值为 1，每次增 1
					'id|+1': 1,
					title: '@ctitle(10, 20)',
					content: '@cparagraph(1, 7)'
				}
			]
		}) as { list: ContentType[] };
		console.log(data.list);
		resolve(data.list);
	});
}

async function init() {
	const tempArr = await loadData();
	allData.value = tempArr.map<ContentType>((item, idx) =>
		markRaw({
			...item,
			arrPos: idx
		})
	);
	positionDataArr = allData.value.map<ContentPosition>((item, idx) => ({
		arrPos: idx, // 当前数据在alldata中的索引位置
		startPos: maxHeight * idx, // 当前索引的top高度
		endPos: maxHeight * idx + maxHeight, //当前数据的bottom位置的是
		height: maxHeight //这个item的预估高度
	}));
}

onMounted(() => {
	init();
});

//更新函数
function updateHeightAndPos() {
	// let pre = window.performance.now();
	//获取列表容器的值
	const contentListDom = contentListRef.value;
	if (!contentListDom) return;

	// 获取列表元素的子元素对象
	const childDomList = contentListDom.children;
	// 遍历渲染的元素
	for (let i = 0; i < childDomList.length; i++) {
		const childEle = childDomList[i] as HTMLElement;
		// 获取当前数据dom节点的数据在postionDataArr中的索引的位置, 自定义的数据项
		const dataIndexStr = childEle.dataset['index'];
		if (!dataIndexStr) continue;

		const dataIndex = parseInt(dataIndexStr, 10);
		// 从allData中获取到该改数据
		const dataItem = positionDataArr[dataIndex];
		if (!dataItem) continue;
		/**
		 * getBoundingClientRect() 返回一个 DOMRect 对象，该对象提供了以下属性：
		 *
		 *		left: 元素左边到视口左边的距离。
		 *		top: 元素顶部到视口顶部的距离。
		 *		right: 元素右边到视口左边的距离。
		 *		bottom: 元素底部到视口顶部的距离。
		 *		x: 等同于 left。
		 *		y: 等同于 top。
		 *		width: 元素的宽度。
		 *		height: 元素的高度。
		 * 注意：getBoundingClientRect() 方法返回的值是相对于视口的左上角，而不是整个页面的左上角。
		 */
		//获取元素的实际高度
		const { height } = childEle.getBoundingClientRect();
		const elePreHeight = dataItem.height;
		// 计算当前数据dom元素的旧高度和当前高度的差值

		// 如：
		// oldHeight为100px，height为50px, 那么dffVal为 50px，那么 oldHeight - dffVal 为 50px
		// oldHeight为50px，height为100px, 那么dffVal为 -50px，那么 oldHeight - dffVal 为 100px

		const dffVal = elePreHeight - height;
		if (dffVal != 0) {
			//当dom元素的实际高度与allData中记录的不一样，则更新高度以及元素的位置信息
			dataItem.height = elePreHeight - dffVal;
			dataItem.endPos = dataItem.endPos - dffVal;

			//更新当前元素之后的元素
			for (let j = dataIndex + 1; j < positionDataArr.length; j++) {
				const preItem = positionDataArr[j - 1];
				const currentItem = positionDataArr[j];
				// c top-> pre - bottom
				currentItem.startPos = preItem.endPos;
				// 更新bottom
				currentItem.endPos = currentItem.startPos + currentItem.height;
			}
		}
	}
	// let cur = window.performance.now();

	//根更新的时候更新容器的高度
	pillarDomHeight.value = positionDataArr.length > 0 ? positionDataArr[positionDataArr.length - 1].endPos : 0;
	// 是否需要修正到头部的滚动
	fixScrollTop();
}

function fixScrollTop() {
	const scrollerContainerDom = scrollerContainerRef.value;
	if (!scrollerContainerDom) return;
	//视口第一个元素与视口顶部的位置存在偏移量，且是向上滚动，则需要修正scrollTop的值
	if (startOffset > 0 && !isPositive) {
		// 需要修正
		//无论新增的的item的实际高度 比记录高度高还是比记录的低，这里都将scrollTop的位置修正为视觉上视口顶部距离视口第一个元素间隔是startOffset的位置
		const newScrollTop = positionDataArr[startIndex.value].endPos - startOffset;
		fixingScrollTop = true;
		nextTick(() => {
			scrollerContainerDom.scrollTo({
				top: newScrollTop
			});
			fixingScrollTop = false;
		});
	}
}

//更新后重新计算当前每一个元素的偏移量和信息
onUpdated(() => {
	nextTick(() => {
		updateHeightAndPos();
	});
});

// 监听滚动事件
function onScroll(evt: UIEvent) {
	// 如果处于修正scrollTop的状态，则不执行scroll回调
	if (fixingScrollTop) return;

	// 支持滚动条的容器
	const scrollerContainerDom = evt.target as HTMLElement;
	if (!scrollerContainerDom) return;
	const { scrollTop, scrollHeight, clientHeight } = scrollerContainerDom;

	// 正数或者0表示向下滚动
	isPositive = scrollTop >= lastScrollTop;
	lastScrollTop = scrollTop;

	//实际测试对比， 数据量越大， 查找的结果还是和明显的
	// const pre = window.performance.now();

	// let idx = 0;
	// let dataItem = positionDataArr[idx];
	// while (dataItem.endPos <= scrollTop) {
	// 	// 只要上面一个元素的bottom小于scrooltop，则说明上一元素就不可近见了， 那就需要进行startIndx++更新了
	// 	idx++;
	// 	dataItem = positionDataArr[idx];
	// }
	// console.log(startIndex.value, idx);
	// // 计算属性会自动更新index
	// startIndex.value = idx;
	// if (!isPositive) {
	// 	//向上滚动需要记录 视口第一个元素底部的位置与scrollTop之间的偏移量，用于修正scrollTop
	// 	startOffset = positionDataArr[startIndex.value].endPos - scrollTop;
	// } else {
	// 	startOffset = 0;
	// }

	// const cur = window.performance.now();
	// console.log('while寻找startIndex耗时', cur - pre);
	startIndex.value = findStartByBinarySearch(positionDataArr, scrollTop) as number;

	if (!isPositive) {
		//向上滚动需要记录 视口第一个元素底部的位置与scrollTop之间的偏移量，用于修正scrollTop
		//记视口第一元素底部的位置与scrollTop之间的偏移量，用于update的时候修正scrollTop
		startOffset = positionDataArr[startIndex.value].endPos - scrollTop;
	} else {
		startOffset = 0;
	}

	// //记视口第一元素底部的位置与scrollTop之间的偏移量，用于update的时候修正scrollTop
	// startOffset = positionDataArr[startIndex.value].endPos - scrollTop;

	const cache = cacheCount.value;
	// 计算当前视口应该显示的元素
	const realStart = Math.max(0, startIndex.value - cache);
	// Y轴移动的距离
	contentListOffset.value = positionDataArr[realStart].startPos;

	appendData(scrollTop, scrollHeight, clientHeight);
}

//判断是不是滚动到底
function isScollEnd(scrollTop: number, scollHieght: number, clientHeight: number) {
	let offsetValue = Math.abs(scollHieght - clientHeight - scrollTop);
	// Math.abs(scrollHeight - clientHeight - scrollTop) < 1 : 判断滚动条是否滚动到了最底部。公式来自MDN
	// return Math.abs(scrollHeight - clientHeight - scrollTop) < 1

	// 上面公式可以判断完全滚动到了最底部，实际更人性化的方式是，接近底部的时候就开始加载数据，
	// 让用户在无感知的情况下就加载了后续数据，因此可以将1调整到一个适合你项目的值
	return offsetValue < 800;
}

const dataLoading = ref<boolean>(false);
const hasMoreData = ref<boolean>(true);

async function appendData(scrollTop: number, scollHieght: number, clientHeight: number) {
	let isScollEndFlag = isScollEnd(scrollTop, scollHieght, clientHeight);
	if (!dataLoading.value && isScollEndFlag && hasMoreData) {
		//滚动到底了该加载数据了
		dataLoading.value = true;
		try {
			let dataList = await loadData();
			console.log('拼接数据');

			if (dataList && dataList.length > 0) {
				let arrPos = allData.value.length;
				dataList = dataList.map((item, index) => {
					return markRaw({ ...item, arrPos: arrPos + index });
				});

				// 最后一个节点
				arrPos = allData.value.length;
				let lastEle = positionDataArr[arrPos - 1];
				//取出来最后一个元素的起始位置作为 作为开始插入元素的起始位置
				let startPos = lastEle.endPos;
				const newPositionArr = dataList.map<ContentPosition>((ele, idx) => {
					const obj = {
						arrPos: arrPos + idx,
						startPos: startPos, // 上一个元素bottom的位置，作为当前元素的top位置
						endPos: startPos + maxHeight, //预估当前元素结束的位置∂
						height: maxHeight
					};
					// 不段更新starPos
					startPos = obj.endPos;
					return obj;
				});

				allData.value.push(...dataList);
				positionDataArr.push(...newPositionArr);
				hasMoreData.value = true;
			} else {
				// 这里判断下次滚动到底部是否还有数据可加载，是根据最后一次请求的请求结果是否有数据来判断的，实际不应该这么做，
				// 因为这会导致多发一次请求。更好的方式应该是每个请求结果中都包含一个字段用于告知前端是否还能请求后端来获取更多数据。

				hasMoreData.value = false;
			}
		} finally {
			// 数据加载完毕都要关闭数据的
			dataLoading.value = false;
		}
	}
}

//二分查找 ns
function findStartByBinarySearch(_positionDataArr: ContentPosition[], scrollTop: number) {
	let pre = window.performance.now();
	let startIdx = 0;
	let endIdx = _positionDataArr.length - 1;
	let resIdx: number | undefined;
	while (startIdx <= endIdx) {
		// 取出整数部分，取出startIndex到endIndex中间的整数部分
		let mid = Math.trunc((startIdx + endIdx) / 2);
		//获取索引引出来的中间元素的位置信息
		const midEle = _positionDataArr[mid];
		//获取中间元素底部位置
		const endPosition = midEle.endPos;
		if (endPosition === scrollTop) {
			//相等的话就是，mid+1
			return mid + 1;
		} else if (endPosition < scrollTop) {
			// 说明中间元素已经不见了
			// 说明索引位置在下面
			startIdx = mid + 1;
		} else if (endPosition > scrollTop) {
			// 说明索引位置在上面,需要 - 1 ps 有必要吗
			if (resIdx === undefined || resIdx > mid) {
				// 存储 end >scrollTop  元素的最小数组素索引， 此时的mid就是最接近的元素
				//  本来就要收缩，左边界的中间值，
				resIdx = mid;
			}

			endIdx = mid - 1;
		}
	}
	let cur = window.performance.now();
	console.log('二分查找耗时', cur - pre);
	console.log(resIdx);
	return resIdx;
}
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

.pillarDom {
	position: absolute;
	top: 0;
	right: 0;
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
	padding: 5px 10px;
	width: 100%;
	border-bottom: 8px solid green;
	// 这里同样很重要，盒模型必须为border-box，item元素的高度才不会因为border值而超出设置的高度
	box-sizing: border-box;

	&:last-child {
		border-bottom: none;
	}

	&:nth-child(odd) {
		background-color: rgb(191 212 84);
	}

	&:nth-child(even) {
		background-color: aqua;
	}
}

.loadingDiv {
	text-align: center;
	color: red;
	font-weight: bold;
}
</style>
