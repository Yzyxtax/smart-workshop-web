<template>
    <div class="graph-container">
        <div ref="graphRef" class="graph-canvas"></div>
        <div ref="infoBox" class="node-info"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Graph, register, getExtension, ExtensionCategory, CanvasEvent, NodeEvent } from '@antv/g6'
import { DagreLayout } from '@antv/layout'

// 避免重复注册布局
if (!getExtension(ExtensionCategory.LAYOUT, 'dagre')) {
    register(ExtensionCategory.LAYOUT, 'dagre', DagreLayout)
}

const graphRef = ref(null)
const infoBox = ref(null)
let graph = null

onMounted(() => {
    const container = graphRef.value
    const info = infoBox.value

    // 使用符合 G6 v5 规范的节点数据
    const nodes = [
        {
            id: 'n1',
            data: { name: '原料准备', desc: '准备原材料并检验质量。' },
            style: {
                labelText: '原料准备',
            }
        },
        {
            id: 'n2',
            data: { name: '生产加工', desc: '开始工序加工，控制工艺参数。' },
            style: {
                labelText: '生产加工',
            }
        },
        {
            id: 'n3',
            data: { name: '质量检测', desc: '抽样检测，确保产品合格。' },
            style: {
                labelText: '质量检测',
            }
        },
        {
            id: 'n4',
            data: { name: '包装出货', desc: '完成包装，安排出货。' },
            style: {
                labelText: '包装出货',
            }
        }
    ]

    // 使用符合规范的边数据
    const edges = [
        {
            id: 'e1',
            source: 'n1',
            target: 'n2',
        },
        {
            id: 'e2',
            source: 'n2',
            target: 'n3',
        },
        {
            id: 'e3',
            source: 'n3',
            target: 'n4',
        }
    ]

    // 创建图实例
    graph = new Graph({
        container,
        autoFit: 'view',
        data: {
            nodes,
            edges
        },
        layout: {
            type: 'dagre',
            rankdir: 'LR',
            nodesep: 60,
            ranksep: 100
        },
        behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element', 'hover-activate',
            {
                type: 'click-select',
                degree: 1,
                state: 'selected',
                neighborState: 'active',
                unselectedState: 'inactive',
                mutiple: true,
            },
        ],
        node: {
            type: 'rect',
            style: {
                size: [120, 50],
                fill: '#409eff',
                stroke: '#1890FF',
                radius: 8,
                labelPlacement: 'center',
                labelFontSize: 14,
                labelFill: '#fff'
            }
        },
        edge: {
            type: 'line',
            style: {
                stroke: '#999',
                endArrow: true
            }
        }
    })

    // 渲染图形
    graph.render()

    // 点击节点显示详情
    graph.on(NodeEvent.CLICK, (evt) => {
        console.log('节点点击事件触发', evt)

        // 在 G6 v5 中，通过 evt.target 获取被点击的元素
        const target = evt.target
        if (target && target.id) {
            // 通过 ID 获取节点数据
            const nodeId = target.id
            const nodeData = graph.getNodeData(nodeId)

            if (nodeData) {
                const data = nodeData.data
                info.innerHTML = `<strong>${data.name}</strong><br>${data.desc}`
                info.style.display = 'block'

                // 使用鼠标位置来定位信息框
                const nativeEvent = evt.nativeEvent
                if (nativeEvent && nativeEvent.clientX && nativeEvent.clientY) {
                    info.style.left = `${nativeEvent.clientX + 15}px`
                    info.style.top = `${nativeEvent.clientY + 15}px`
                } else {
                    // 备用方案：使用固定位置
                    info.style.left = '50px'
                    info.style.top = '50px'
                }

                console.log('显示信息框', data.name)
                return // 成功处理节点点击，直接返回
            }
        }

        console.log('未找到节点数据')
    })

    // 点击画布空白处隐藏详情 - 使用 G6 的 CanvasEvent
    graph.on(CanvasEvent.CLICK, (evt) => {
        console.log('画布点击事件触发', evt.target)
        // 如果没有点击到任何图形元素，则隐藏信息框
        if (!evt.target || !evt.target.id) {
            info.style.display = 'none'
            console.log('隐藏信息框')
        }
    })
})

onBeforeUnmount(() => {
    if (graph) {
        graph.destroy()
    }
})
</script>

<style scoped>
.graph-container {
    position: relative;
    width: 100%;
    height: 400px;
    border: 1px solid #e8e8e8;
    /* 添加边框以便看清画布范围 */
}

.graph-canvas {
    width: 100%;
    height: 100%;
    background: #fff;
}

.node-info {
    position: fixed;
    /* 使用 fixed 定位更可靠 */
    display: none;
    background: white;
    border: 1px solid #ddd;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    pointer-events: none;
    z-index: 1000;
    /* 确保信息框在最上层 */
    max-width: 200px;
    word-wrap: break-word;
}
</style>