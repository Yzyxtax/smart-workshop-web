<template>
    <div class="card">
        <div class="card-header">
            <el-checkbox v-model="checked" @change="handleCheckChange" />
        </div>

        <ul class="list">
            <li class="element">
                <p class="label">工步名称：</p>
                <span>{{ step.name || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">使用设备：</p>
                <span>{{ step.equipment || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">设备型号：</p>
                <span>{{ step.model || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">设备功能：</p>
                <span>{{ step.function || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">描述：</p>
                <span>{{ step.description || '-' }}</span>
            </li>
            <div class="separator"></div>

            <li class="element">
                <p class="label">调用情况：</p>
                <span>{{ step.status || '-' }}</span>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, watch, } from 'vue'
import { ElCheckbox } from 'element-plus'

const emit = defineEmits(['selectChange'])

const props = defineProps({
    step: {
        type: Object,
        required: true
    }
})

// 控制复选框
const checked = ref(false)

// 当选中状态变化时，通知父组件
const handleCheckChange = (val) => {
    emit('selectChange', {
        id: props.step.id,
        checked: val
    })
}
</script>

<style scoped>
.card {
    min-width: 200px;
    background-color: #e8e8e8;
    border-radius: 10px;
    padding: 10px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
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

.card .list {
    list-style-type: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0px 10px;
}

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
}

.card .list .element:hover {
    background-color: #5353ff;
    color: #ffffff;
    transform: translate(1px, -1px);
}

.card .list .element:active {
    transform: scale(0.99);
}
</style>
