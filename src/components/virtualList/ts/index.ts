/*
 * @Author: htz
 * @Date: 2024-06-27 16:13:24
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2024-06-29 00:42:57
 * @Description: 类型
 */

export interface ContentType {
	id: number;
	title: string;
	content: string;
	arrPos: number;
}

export interface VitrualItem<T> {
	/**
	 * 数据
	 */
	data: T;
	/**
	 * 当前数据处在allData数组的索引位置
	 */
	arrPos: number;
	/**
	 * 当前数据dom的top位置
	 */
	startPos: number;
	/**
	 * 当前数据dom的bottom位置
	 */
	endPos: number;
	/**
	 * 当前数据dom的高度(初始值为猜测高度【预估高度】)
	 */
	height: number;
}

export interface ContentPosition {
	/**
	data: T;
	/**
	 * 当前数据处在allData数组的索引位置
	 */
	arrPos: number;
	/**
	 * 当前数据dom的top位置
	 */
	startPos: number;
	/**
	 * 当前数据dom的bottom位置
	 */
	endPos: number;
	/**
	 * 当前数据dom的高度(初始值为猜测高度【预估高度】)
	 */
	height: number;
}
