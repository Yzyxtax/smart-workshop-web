<script setup>
/**
 * AI 助手浮动入口按钮（FAB）
 *
 * 视觉 4 态（默认 / hover / active / 收起）+ 呼吸光晕动画
 * 位置：fixed, right: 24px; bottom: 24px; z-index: 1000
 *
 * Props:
 *   open: Boolean  — 抽屉是否打开（控制收起态图标切换）
 *
 * Emits:
 *   update:open — 切换抽屉开/关
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['update:open'])

// 是否正在 active（点击缩放反馈）
const isActive = ref(false)

// 当前图标：抽屉打开时显示 Close，关闭时显示 MagicStick
const icon = computed(() => props.open ? 'Close' : 'MagicStick')

// 点击处理：100ms 缩放反馈后 emit
const handleClick = () => {
  isActive.value = true
  setTimeout(() => {
    isActive.value = false
  }, 120)
  emit('update:open', !props.open)
}

// ==================== 快捷键监听 ====================
const handleKeydown = (e) => {
  // Ctrl + / 切换抽屉
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault()
    emit('update:open', !props.open)
  }
  // Esc 关闭抽屉
  if (e.key === 'Escape' && props.open) {
    emit('update:open', false)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    class="ai-fab"
    :class="{ 'ai-fab--active': isActive, 'ai-fab--closed': open }"
    @click="handleClick"
    :title="open ? '关闭智能助手 (Esc)' : '智能助手 (Ctrl+/)'"
  >
    <!-- 呼吸光晕层 -->
    <div class="ai-fab__aura" />

    <!-- 图标 -->
    <el-icon class="ai-fab__icon">
      <component :is="icon" />
    </el-icon>

    <!-- Hover tooltip（原生 title 备选） -->
    <span class="ai-fab__tooltip">
      {{ open ? '关闭' : '智能助手' }}
      <kbd>Ctrl+/</kbd>
    </span>
  </div>
</template>

<style scoped>
/* ========== FAB 容器 ========== */
.ai-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #06b6d4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(99, 102, 241, .35);
  transition:
    transform 150ms cubic-bezier(.4,0,.2,1),
    box-shadow 150ms cubic-bezier(.4,0,.2,1),
    background 240ms cubic-bezier(.4,0,.2,1);
  user-select: none;
}

/* ========== Hover 态 ========== */
.ai-fab:hover {
  transform: scale(1.07);
  box-shadow: 0 10px 28px rgba(99, 102, 241, .45);
}

/* ========== Active 点击态 ========== */
.ai-fab--active {
  transform: scale(0.95);
}

/* ========== 收起态（抽屉打开时） ========== */
.ai-fab--closed {
  background: linear-gradient(135deg, #64748b, #475569);
}

.ai-fab--closed:hover {
  transform: scale(1.07);
}

/* ========== 呼吸光晕 ========== */
.ai-fab__aura {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.18);
  animation: fab-aura 2.4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes fab-aura {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.35);
    opacity: 0;
  }
}

/* 收起态光晕变灰 */
.ai-fab--closed .ai-fab__aura {
  background: rgba(100, 116, 139, 0.12);
}

/* ========== 图标 ========== */
.ai-fab__icon {
  color: #fff;
  font-size: 24px;
  position: relative;
  z-index: 1;
}

/* ========== 快捷键 tooltip ========== */
.ai-fab__tooltip {
  position: absolute;
  right: 64px;
  top: 50%;
  transform: translateY(-50%);
  background: #1f2937;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms;
}

.ai-fab__tooltip kbd {
  background: rgba(255, 255, 255, 0.15);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
  margin-left: 4px;
}

.ai-fab:hover .ai-fab__tooltip {
  opacity: 1;
}

/* ========== 窄屏适配 ========== */
@media (max-width: 768px) {
  .ai-fab {
    right: 16px;
    bottom: 16px;
    width: 48px;
    height: 48px;
  }

  .ai-fab__icon {
    font-size: 20px;
  }
}
</style>
