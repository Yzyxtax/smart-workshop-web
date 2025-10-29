<template>
    <button class="fancy-btn" :style="buttonStyles" @click="$emit('click', $event)">
        <!-- 显示文本，用于悬停前的显示和无障碍访问 -->
        <span class="btn-text" :aria-hidden="true">{{ text }}</span>

        <!-- 悬停后显示的字母元素 -->
        <template v-for="(char, index) in textArray" :key="index">
            <i class="char-element" :style="{ transitionDelay: `${index * delayMultiplier}ms` }">
                {{ char }}
            </i>
        </template>
    </button>
</template>

<script setup>
import { computed } from 'vue'

// 定义 props
const props = defineProps({
    text: {
        type: String,
        default: 'Button',
        required: true
    },
    // 主色调 (背景色和阴影色)
    primaryColor: {
        type: String,
        default: 'hsl(210deg 100% 44%)' // 默认蓝色
    },
    // 文字颜色
    textColor: {
        type: String,
        default: '#2196F3'
    },
    // 悬停动画延迟系数 (控制字母依次出现的速度)
    delayMultiplier: {
        type: Number,
        default: 45 // 与原代码保持一致
    }
})

// 定义事件
defineEmits(['click'])

// 计算按钮样式
const buttonStyles = computed(() => ({
    '--primary-color': props.primaryColor,
    '--text-color': props.textColor
}))

// 将文本拆分为字符数组
const textArray = computed(() => props.text.split(''))

</script>

<style scoped>
.fancy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    position: relative;
    padding: 0 20px;
    font-size: 18px;
    text-transform: uppercase;
    border: 0;
    /* 使用 CSS 变量替代固定颜色 */
    box-shadow: var(--primary-color) 0px 7px 0px 0px;
    background-color: var(--primary-color);
    border-radius: 12px;
    overflow: hidden;
    transition: 31ms cubic-bezier(0.5, 0.7, 0.4, 1);
    cursor: pointer;
}

/* 按钮文本 - 悬停前显示 */
.btn-text {
    color: var(--text-color);
    font-weight: bold;
    letter-spacing: 4px;
    z-index: 1;
    /* 确保在最上层 */
    transition: all 0.2s ease;
}

/* 悬停时隐藏原始文本 */
.fancy-btn:hover .btn-text {
    transform: translateY(-100%);
    opacity: 0;
}

/* 字母元素 - 悬停后显示 */
.char-element {
    color: var(--text-color);
    font-size: 15px;
    font-weight: bold;
    letter-spacing: 4px;
    font-style: normal;
    position: absolute;
    /* 初始状态在下方不可见 */
    transform: translateY(100%);
    opacity: 0;
    /* 为每个字母设置不同的延迟 */
    transition: all 0.2s ease;
}

/* 悬停时字母依次出现 */
.fancy-btn:hover .char-element {
    transform: translateY(0);
    opacity: 1;
}

/* 按下效果 */
.fancy-btn:active {
    box-shadow: none;
    transform: translateY(7px);
    transition: 35ms cubic-bezier(0.5, 0.7, 0.4, 1);
}

/* 防止文字被选中 */
.fancy-btn {
    user-select: none;
    -webkit-user-select: none;
}
</style>