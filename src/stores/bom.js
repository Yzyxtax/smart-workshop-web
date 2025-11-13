import { ref } from 'vue'
import { defineStore } from 'pinia'
import { queryBomListApi } from '@/api/bom';

export const useBomStore = defineStore('counter', () => {
    // 数据state
    const bomTreeData = ref([]); // 存储树形数据


    // getter



    // actions
    // 获取BOM数据并转换为树形结构
    const loadBomData = async () => {
        try {
            const response = await queryBomListApi();
            let rawData = [];
            if (response.code == 200) {
                rawData = response.data;
            }
            // 转换为树形结构
            bomTreeData.value = listToTree(rawData, 'id', 'parentId');
        } catch (error) {
            console.error('获取BOM数据失败:', error);
        }
    };
    // 将平铺列表转换为树形结构的辅助函数
    const listToTree = (list, idKey = 'id', parentKey = 'parentId', childrenKey = 'children') => {
        const map = {};
        const roots = [];

        // 创建一个映射，key为节点id，value为节点对象
        for (const item of list) {
            map[item[idKey]] = { ...item, [childrenKey]: [] };
        }

        for (const item of list) {
            const node = map[item[idKey]];
            const parentId = item[parentKey];

            if (parentId === null || parentId === undefined) {
                // 没有父节点，说明是根节点
                roots.push(node);
            } else {
                // 有父节点，在父节点的children数组中添加当前节点
                if (!map[parentId]) {
                    console.warn(`Parent node with id ${parentId} not found for item ${item[idKey]}`);
                    continue; // 跳过找不到父节点的项
                }
                map[parentId][childrenKey].push(node);
            }
        }
        return roots;
    };

    return { bomTreeData, loadBomData, listToTree }
})