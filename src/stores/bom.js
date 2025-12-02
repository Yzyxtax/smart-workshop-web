import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { queryBomListApi, addBom as addBomApi, deleteBom as deleteBomApi, saveLevelApi as saveLevelApi } from "@/api/bom";

export const useBomStore = defineStore("bom", () => {
    const bomTreeData = ref([]);
    const expandedKeys = ref(new Set()); // 记录展开的节点

    // 保存展开状态
    const saveExpandedState = (tree) => {
        const keys = new Set();
        const traverse = (nodes, parentPath = '') => {
            nodes.forEach(node => {
                const currentPath = parentPath ? `${parentPath}-${node.id}` : String(node.id);
                if (node.expanded) {
                    keys.add(node.id);
                }
                if (node.children) {
                    traverse(node.children, currentPath);
                }
            });
        };
        traverse(tree);
        return keys;
    };

    // 恢复展开状态
    const restoreExpandedState = (tree, expandedKeys) => {
        const traverse = (nodes) => {
            nodes.forEach(node => {
                node.expanded = expandedKeys.has(node.id);
                if (node.children) {
                    traverse(node.children);
                }
            });
        };
        traverse(tree);
    };

    const loadBomData = async () => {
        try {
            // 保存当前展开状态
            const currentExpanded = new Set(expandedKeys.value);

            const response = await queryBomListApi();
            if (response.code === 200) {
                const tree = listToTree(response.data);
                // 恢复展开状态
                restoreExpandedState(tree, currentExpanded);
                bomTreeData.value = JSON.parse(JSON.stringify(tree));
                // 更新展开状态记录
                expandedKeys.value = currentExpanded;
            }
        } catch (err) {
            console.error("加载 BOM 数据失败:", err);
        }
    };

    // 添加节点（局部更新）
    const addNode = (parentId, newNodeData) => {
        const traverse = (nodes) => {
            for (let node of nodes) {
                if (node.id === parentId) {
                    if (!node.children) node.children = [];
                    const newNode = {
                        id: newNodeData.id,
                        label: newNodeData.nameSpecification,
                        parentId: parentId,
                        children: []
                    }
                    node.children.push(newNode);
                    return true;
                }
                if (node.children && traverse(node.children)) {
                    return true;
                }
            }
            return false;
        };
        traverse(bomTreeData.value);
    };

    // 删除节点（局部更新）
    const removeNode = (nodeId) => {
        const traverse = (nodes) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === nodeId) {
                    nodes.splice(i, 1);
                    return true;
                }
                if (nodes[i].children && traverse(nodes[i].children)) {
                    return true;
                }
            }
            return false;
        };
        traverse(bomTreeData.value);
    };

    // 移动节点（局部更新）
    const moveNode = (nodeId, newParentId) => {
        let nodeToMove = null;
        let oldParent = null;

        // 找到要移动的节点和它的父节点
        const findNode = (nodes, parent = null) => {
            for (let node of nodes) {
                if (node.id === nodeId) {
                    nodeToMove = { ...node };
                    oldParent = parent;
                    return true;
                }
                if (node.children && findNode(node.children, node)) {
                    return true;
                }
            }
            return false;
        };

        findNode(bomTreeData.value);

        if (nodeToMove) {
            // 从原父节点删除
            if (oldParent) {
                oldParent.children = oldParent.children.filter(child => child.id !== nodeId);
            } else {
                // 如果是根节点
                bomTreeData.value = bomTreeData.value.filter(child => child.id !== nodeId);
            }

            // 添加到新父节点
            if (newParentId) {
                const newParent = findNodeById(bomTreeData.value, newParentId);
                if (newParent) {
                    if (!newParent.children) newParent.children = [];
                    newParent.children.push(nodeToMove);
                }
            } else {
                // 添加为根节点
                bomTreeData.value.push(nodeToMove);
            }
        }
    };

    const findNodeById = (nodes, id) => {
        for (let node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const listToTree = (list, idKey = "id", parentKey = "parentId", childrenKey = "children") => {
        const map = {};
        const roots = [];

        list.forEach(item => {
            map[item[idKey]] = { ...item, [childrenKey]: [] };
        });

        list.forEach(item => {
            const parentId = item[parentKey];
            if (parentId === null || parentId === undefined) {
                roots.push(map[item[idKey]]);
            } else if (map[parentId]) {
                map[parentId][childrenKey].push(map[item[idKey]]);
            }
        });

        return roots;
    };

    // 将树形结构转化为一维数组
    const flattenBomTree = (tree) => {
        const result = [];
        const traverse = (nodes) => {
            for (const node of nodes) {
                // 将当前节点的基本信息添加到结果数组中
                result.push({
                    id: node.id,
                    label: node.label,
                    parentId: node.parentId
                    // 可以根据需要添加其他字段，如 expanded 等
                });
                // 如果有子节点，递归遍历
                if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                    traverse(node.children);
                }
            }
        };

        if (tree && Array.isArray(tree)) {
            traverse(tree);
        }

        return result;
    };

    // 实时获取扁平化的数据
    const flattenedBomData = computed(() => {
        return flattenBomTree(bomTreeData.value);
    });

    return {
        bomTreeData,
        expandedKeys,
        loadBomData,
        addNode,
        removeNode,
        moveNode,
        listToTree,
        flattenedBomData
    };
});