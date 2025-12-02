<template>
    <div class="card">
        <div class="card-header">
            <el-checkbox v-model="checked" @change="handleCheckChange" />
        </div>

        <ul class="list">
            <li class="element">
                <p class="label">工序名称：</p>
                <span>{{ process.processName || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">标准工时：</p>
                <span>{{ process.plannedWorkingHours ?? '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">描述：</p>
                <span>{{ process.description || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">质量检查点：</p>
                <span>{{ process.qualityControlPoint || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">输入物料：</p>
                <span>{{ input || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">输出物料：</p>
                <span>{{ output || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">包含工步：</p>
                <span>{{ workStep || '-' }}</span>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['selectChange'])

const props = defineProps({
    process: {
        type: Object,
        required: true
    }
})

const checked = ref(false)

// 从 props.process 中读取显示字段（input/output/workStep 由父组件传入为字符串）
const input = computed(() => props.process.input)
const output = computed(() => props.process.output)
const workStep = computed(() => props.process.workStep)

// 当父组件可能会重写 props 时，保持 checkbox 状态同步（如果你需要由外部控制，可改为 prop 控制）
watch(
    () => props.process.id,
    () => {
        // 当展示的数据切换时，默认取消选中（可根据需求修改）
        checked.value = false
    }
)

// 选中状态变化时通知父组件
const handleCheckChange = (val) => {
    emit('selectChange', {
        id: props.process.id,
        checked: val
    })
}
</script>

<style scoped>
.card {
    --card-max-h: 260px;
    /* 可按需调整最大高度 */
    min-width: 200px;
    max-height: var(--card-max-h);
    background-color: #e8e8e8;
    border-radius: 10px;
    padding: 10px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    overflow: hidden;
    /* 保持卡片外部不滚动，内部列表滚动 */
}

.card-header {
    position: absolute;
    top: 8px;
    right: 10px;
    z-index: 1;
}

.card .separator {
    border-top: 1.5px solid #42434a;
}

/* 列表区域限制高度并启用滚动，保证多行文本不会撑开卡片 */
.card .list {
    list-style-type: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0px 10px;
    overflow-y: auto;
    max-height: calc(var(--card-max-h) - 28px);
    /* 留出头部与内边距空间，按需微调 */
}

/* 固定标签宽度以便对齐，内容允许换行并占剩余空间 */
.card .list .element {
    display: flex;
    align-items: center;
    color: #7e8590;
    gap: 10px;
    transition: all 0.3s ease-out;
    padding: 4px 7px;
    border-radius: 6px;
}

.card .list .element .label {
    font-weight: 600;
    width: 90px;
    /* 固定宽度，确保各卡片同一项对齐，可调整 */
    flex-shrink: 0;
}

.card .list .element span {
    word-break: break-word;
    flex: 1;
}

.card .list .element:hover {
    background-color: #5353ff;
    color: #ffffff;
    transform: translate(1px, -1px);
}

.card .list .element:active {
    transform: scale(0.99);
}

/* 可选：美化滚动条（WebKit） */
.card .list::-webkit-scrollbar {
    width: 8px;
}

.card .list::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;
}
</style>
