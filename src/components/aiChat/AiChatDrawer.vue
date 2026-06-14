<script setup>
/**
 * AI 聊天抽屉容器组件
 *
 * 整合三栏布局：会话列表 + 消息流 + 输入区
 *
 * 标题栏按钮：新建会话、折叠列表、全屏切换、关闭
 *
 * Props:
 *   visible: Boolean — 抽屉是否可见
 *
 * Emits:
 *   update:visible — 更新抽屉可见性
 *
 * 内部通过 useAiChatStore 获取所有状态和操作。
 */
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { useAiChatStore } from '@/stores/aiChat'
import AiSessionList from './AiSessionList.vue'
import AiMessageStream from './AiMessageStream.vue'
import AiInputBox from './AiInputBox.vue'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible'])

const store = useAiChatStore()

// 输入框组件引用
const inputBoxRef = ref(null)

// ==================== 本地 UI 状态 ====================

// 拖拽调整宽度
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartWidth = ref(0)

// 当前视口宽度
const viewportWidth = ref(window.innerWidth)

// 是否窄屏（< 768 强制全屏）
const isNarrowScreen = computed(() => viewportWidth.value < 768)

// 实际抽屉宽度
const actualWidth = computed(() => {
  if (store.fullscreen || isNarrowScreen.value) return '100vw'
  return store.drawerWidth + 'px'
})

// ==================== 标题栏操作 ====================

const handleClose = () => {
  emit('update:visible', false)
}

const handleCreateSession = async () => {
  await store.createSession()
  // 聚焦输入框
  nextTick(() => {
    inputBoxRef.value?.focus?.()
  })
}

const handleToggleList = () => {
  store.toggleListCollapsed()
}

const handleToggleFullscreen = () => {
  store.toggleFullscreen()
}

// ==================== 消息操作 ====================

const handleSend = (content) => {
  if (!store.currentSessionId) {
    // 如果没有选中会话，自动创建
    store.createSession().then(() => {
      store.sendMessage(content)
    })
    return
  }
  store.sendMessage(content)
}

const handleStop = () => {
  store.abortStream()
}

const handleClear = () => {
  if (inputBoxRef.value) {
    inputBoxRef.value.clearInput()
  }
}

const handleRetry = () => {
  store.retryLastMessage()
}

// ==================== 拖拽调整宽度（仅桌面端） ====================

const startDrag = (e) => {
  if (store.fullscreen) return
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartWidth.value = store.drawerWidth
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

const onDrag = (e) => {
  if (!isDragging.value) return
  const deltaX = dragStartX.value - e.clientX
  store.setDrawerWidth(dragStartWidth.value + deltaX)
}

const stopDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// ==================== 视口监听 ====================
const handleResize = () => {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('resize', handleResize)
})

// ==================== 抽屉打开时加载数据 ====================
watch(() => props.visible, (val) => {
  if (val && store.sessions.length === 0) {
    store.loadSessions()
  }
})

import { nextTick } from 'vue'
</script>

<template>
  <!-- ===== 遮罩层（窄屏/全屏不显示） ===== -->
  <Teleport to="body">
    <div
      v-if="visible && !store.fullscreen && !isNarrowScreen"
      class="ai-drawer__overlay"
      @click="handleClose"
    />

    <!-- ===== 抽屉主体 ===== -->
    <div
      v-show="visible"
      class="ai-drawer"
      :class="{
        'ai-drawer--fullscreen': store.fullscreen || isNarrowScreen,
        'ai-drawer--dragging': isDragging
      }"
      :style="{ width: actualWidth }"
    >
      <!-- 拖拽手柄（左缘） -->
      <div
        v-if="!store.fullscreen && !isNarrowScreen"
        class="ai-drawer__resize-handle"
        @mousedown="startDrag"
      />

      <!-- ===== 标题栏 ===== -->
      <div class="ai-drawer__header">
        <div class="ai-drawer__title">
          <span class="ai-drawer__title-icon">✦</span>
          <span>智能助手</span>
        </div>

        <div class="ai-drawer__header-actions">
          <el-tooltip content="新建会话" :show-after="500">
            <el-button size="small" text circle @click="handleCreateSession">
              <el-icon><Plus /></el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip :content="store.listCollapsed ? '展开列表' : '折叠列表'" :show-after="500">
            <el-button size="small" text circle @click="handleToggleList">
              <el-icon>
                <Fold v-if="store.listCollapsed" />
                <Expand v-else />
              </el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip :content="store.fullscreen ? '退出全屏' : '全屏'" :show-after="500">
            <el-button size="small" text circle @click="handleToggleFullscreen">
              <el-icon>
                <FullScreen />
              </el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip content="关闭 (Esc)" :show-after="500">
            <el-button size="small" text circle @click="handleClose">
              <el-icon><Close /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- ===== 内容区 ===== -->
      <div class="ai-drawer__body">
        <!-- 会话列表（可折叠） -->
        <div
          v-show="!store.listCollapsed"
          class="ai-drawer__sessions"
          :style="{ width: isNarrowScreen ? '100%' : '200px' }"
        >
          <AiSessionList
            :sessions="store.sessions"
            :current-id="store.currentSessionId"
            :loading="store.sessionsLoading"
            :error="store.sessionsError"
            @select="store.switchSession"
            @create="handleCreateSession"
            @delete="store.deleteSession"
            @retry="store.loadSessions"
          />
        </div>

        <!-- 消息流 + 输入区 -->
        <div class="ai-drawer__chat">
          <AiMessageStream
            :messages="store.messages"
            :streaming="store.streaming"
            @retry="handleRetry"
          />

          <AiInputBox
            ref="inputBoxRef"
            :disabled="!store.currentSessionId"
            :streaming="store.streaming"
            @send="handleSend"
            @stop="handleStop"
            @clear="handleClear"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ========== 遮罩 ========== */
.ai-drawer__overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.1);
}

/* ========== 抽屉主体 ========== */
.ai-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  width: 480px;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, .08);
  transition: width 240ms cubic-bezier(.4,0,.2,1);
}

.ai-drawer--fullscreen {
  transition: width 400ms cubic-bezier(.2,0,0,1);
}

.ai-drawer--dragging {
  transition: none;
}

/* ========== 拖拽手柄 ========== */
.ai-drawer__resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
  z-index: 10;
}

.ai-drawer__resize-handle:hover,
.ai-drawer--dragging .ai-drawer__resize-handle {
  background: rgba(99, 102, 241, 0.15);
}

/* ========== 标题栏 ========== */
.ai-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.ai-drawer__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
}

.ai-drawer__title-icon {
  font-size: 20px;
  background: linear-gradient(135deg, #6366f1, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ai-drawer__header-actions {
  display: flex;
  gap: 4px;
}

/* ========== 内容区 ========== */
.ai-drawer__body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ========== 会话列表栏 ========== */
.ai-drawer__sessions {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  background: #fafafa;
}

/* ========== 聊天区 ========== */
.ai-drawer__chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ========== 窄屏适配 ========== */
@media (max-width: 768px) {
  .ai-drawer__body {
    flex-direction: column;
  }

  .ai-drawer__sessions {
    width: 100%;
    max-height: 40%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
}
</style>
