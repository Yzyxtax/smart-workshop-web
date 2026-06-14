<script setup>
/**
 * AI 监控指标页面 (/aiMetrics)
 *
 * 功能：
 * - 4 个 KPI 指标卡（累计请求 / 成功率 / 平均延迟 / 已注册工具）
 * - 错误类型分布（饼图）
 * - 已注册工具列表（按 category 分组）
 * - 自动刷新（默认关闭，开启后每 30s 拉取）
 *
 * 对应后端接口：GET /ai/metrics
 */
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { getMetricsApi } from '@/api/aiMetrics'
import { ElMessage } from 'element-plus'

// ==================== 指标数据 ====================
const metrics = ref({
  totalRequests: 0,
  successRate: 0,
  avgLatencyMs: 0,
  registeredTools: 0,
  errorCounts: {},
  toolCategories: {}
})

const loading = ref(false)

// ==================== 加载数据 ====================
const loadMetrics = async () => {
  loading.value = true
  try {
    const result = await getMetricsApi()
    if (result.code === 200) {
      metrics.value = result.data ?? metrics.value
      lastUpdateTime.value = new Date()
      // 数字缩放反馈
      triggerScale.value = true
      setTimeout(() => { triggerScale.value = false }, 200)
    }
  } catch (e) {
    // 静默处理
  } finally {
    loading.value = false
  }
}

// ==================== 自动刷新 ====================
const autoRefresh = ref(false)
const refreshTimer = ref(null)
const lastUpdateTime = ref(null)
const triggerScale = ref(false)

const toggleAutoRefresh = (val) => {
  if (val) {
    refreshTimer.value = setInterval(loadMetrics, 30000)
    ElMessage.success('已开启自动刷新（每 30 秒）')
  } else {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
  }
}

// ==================== 错误类型分布（饼图数据） ====================
const errorPieData = computed(() => {
  const counts = metrics.value.errorCounts || {}
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
})

// 错误码颜色映射
const errorColorMap = {
  RATE_LIMIT: '#f59e0b',
  LLM_UNAVAILABLE: '#ef4444',
  LLM_EMPTY: '#f97316',
  INTERNAL_ERROR: '#dc2626',
  NETWORK_ERROR: '#6b7280',
  TIMEOUT: '#eab308'
}

// ==================== category 配色表（§A.3） ====================
const categoryConfig = {
  'BOM管理': { color: '#a855f7', bg: '#f3e8ff' },
  '设备管理': { color: '#10b981', bg: '#ecfdf5' },
  '产线管理': { color: '#0ea5e9', bg: '#e0f2fe' },
  '工序管理': { color: '#f59e0b', bg: '#fef3c7' },
  '工步管理': { color: '#eab308', bg: '#fef9c3' },
  '班组管理': { color: '#06b6d4', bg: '#cffafe' },
  '生产管理': { color: '#6366f1', bg: '#e0e7ff' }
}

// 格式化工具列表
const toolCategories = computed(() => {
  const cats = metrics.value.toolCategories || {}
  return Object.entries(cats).map(([name, tools]) => ({
    name,
    tools: Array.isArray(tools) ? tools : [],
    config: categoryConfig[name] || { color: '#6b7280', bg: '#f3f4f6' }
  }))
})

// ==================== 手动刷新 ====================
const handleRefresh = () => {
  loadMetrics()
}

// ==================== 格式化 ====================
const formatRate = (rate) => {
  if (rate === undefined || rate === null) return '-'
  return `${(rate * 100).toFixed(1)}%`
}

const formatMs = (ms) => {
  if (ms === undefined || ms === null) return '-'
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`
  return `${Math.round(ms)} ms`
}

// 错误总数（用于饼图 conic-gradient）
const totalErrors = computed(() =>
  errorPieData.value.reduce((sum, d) => sum + d.value, 0)
)

const lastUpdateTimeText = computed(() => {
  if (!lastUpdateTime.value) return '尚未更新'
  const d = lastUpdateTime.value
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

// ==================== 生命周期 ====================
onMounted(() => {
  loadMetrics()
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<template>
  <div class="ai-metrics-page">
    <h2 class="page-title">AI 监控指标</h2>

    <!-- ===== KPI 指标卡（4 个） ===== -->
    <div class="kpi-grid">
      <!-- 累计请求数 -->
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-card__inner">
          <div class="kpi-card__label">累计请求数</div>
          <div class="kpi-card__value" :class="{ 'kpi-card__value--pop': triggerScale }">
            {{ (metrics.totalRequests ?? 0).toLocaleString() }}
          </div>
          <div class="kpi-card__sub">请求总数</div>
        </div>
      </el-card>

      <!-- 成功率 -->
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-card__inner">
          <div class="kpi-card__label">成功率</div>
          <div class="kpi-card__value" :class="{ 'kpi-card__value--pop': triggerScale }">
            {{ formatRate(metrics.successRate) }}
          </div>
          <div class="kpi-card__progress">
            <el-progress
              type="circle"
              :percentage="Math.round((metrics.successRate ?? 0) * 100)"
              :width="48"
              :stroke-width="6"
              :color="(metrics.successRate ?? 0) >= 0.95 ? '#10b981' : (metrics.successRate ?? 0) >= 0.8 ? '#f59e0b' : '#dc2626'"
            />
          </div>
        </div>
      </el-card>

      <!-- 平均延迟 -->
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-card__inner">
          <div class="kpi-card__label">平均延迟</div>
          <div class="kpi-card__value" :class="{ 'kpi-card__value--pop': triggerScale }">
            {{ formatMs(metrics.avgLatencyMs) }}
          </div>
          <div class="kpi-card__sub">单次请求耗时</div>
        </div>
      </el-card>

      <!-- 已注册工具 -->
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-card__inner">
          <div class="kpi-card__label">已注册工具</div>
          <div class="kpi-card__value" :class="{ 'kpi-card__value--pop': triggerScale }">
            {{ metrics.registeredTools ?? 0 }}
          </div>
          <div class="kpi-card__sub">{{ toolCategories.length }} 大分类</div>
        </div>
      </el-card>
    </div>

    <!-- ===== 下半区：错误分布 + 工具列表 ===== -->
    <div class="metrics-bottom">
      <!-- 错误类型分布 -->
      <el-card class="metrics-panel" shadow="never">
        <template #header>
          <span class="panel-title">错误类型分布</span>
        </template>

        <div v-if="errorPieData.length === 0" class="panel-empty">
          暂无错误记录
        </div>

        <div v-else class="error-distribution">
          <!-- 简易饼图区域 -->
          <div class="error-pie-visual">
            <div
              class="error-pie-chart"
              :style="{
                background: `conic-gradient(${
                  errorPieData.map((d, i) => {
                    const start = errorPieData.slice(0, i).reduce((s, d) => s + d.value, 0) / totalErrors * 360
                    const end = (errorPieData.slice(0, i + 1).reduce((s, d) => s + d.value, 0)) / totalErrors * 360
                    return `${errorColorMap[d.name] || '#6b7280'} ${start}deg ${end}deg`
                  }).join(',')
                })`
              }"
            />
            <div class="error-pie-center">错误</div>
          </div>

          <!-- 图例 -->
          <div class="error-legend">
            <div v-for="d in errorPieData" :key="d.name" class="error-legend-item">
              <span
                class="error-legend-dot"
                :style="{ backgroundColor: errorColorMap[d.name] || '#6b7280' }"
              />
              <span class="error-legend-name">{{ d.name }}</span>
              <span class="error-legend-count">{{ d.value }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 已注册工具列表 -->
      <el-card class="metrics-panel" shadow="never">
        <template #header>
          <span class="panel-title">已注册工具</span>
        </template>

        <div v-if="toolCategories.length === 0" class="panel-empty">
          暂无已注册工具
        </div>

        <div v-else class="tool-category-list">
          <div
            v-for="cat in toolCategories"
            :key="cat.name"
            class="tool-category-group"
          >
            <div class="tool-category-header" :style="{ color: cat.config.color }">
              [{{ cat.name }}]
            </div>
            <div class="tool-category-tools">
              <span
                v-for="tool in cat.tools"
                :key="tool"
                class="tool-badge"
                :style="{ backgroundColor: cat.config.bg, color: cat.config.color }"
              >
                {{ tool }}
              </span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- ===== 底部刷新控制 ===== -->
    <div class="metrics-footer">
      <el-checkbox
        v-model="autoRefresh"
        @change="toggleAutoRefresh"
      >
        自动刷新 (30s)
      </el-checkbox>
      <el-button size="small" @click="handleRefresh" :loading="loading">
        <el-icon><Refresh /></el-icon>
        手动刷新
      </el-button>
      <span class="last-update">
        上次更新: {{ lastUpdateTimeText }}
      </span>
    </div>
  </div>
</template>


<style scoped>
.ai-metrics-page {
  padding: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px;
}

/* ========== KPI 指标卡 ========== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 100px;
}

.kpi-card__label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.kpi-card__value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  transition: transform 200ms cubic-bezier(.4,0,.2,1);
}

.kpi-card__value--pop {
  transform: scale(1.08);
}

.kpi-card__sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.kpi-card__progress {
  margin-top: 4px;
}

/* ========== 下半区 ========== */
.metrics-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.metrics-panel {
  height: fit-content;
}

.panel-title {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
}

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #9ca3af;
  font-size: 13px;
}

/* ========== 错误分布 ========== */
.error-distribution {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 0;
}

.error-pie-visual {
  position: relative;
  flex-shrink: 0;
}

.error-pie-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
}

.error-pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.error-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.error-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.error-legend-name {
  color: #6b7280;
  flex: 1;
}

.error-legend-count {
  font-weight: 600;
  color: #1f2937;
}

/* ========== 工具分类列表 ========== */
.tool-category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-category-group {
  padding: 4px 0;
}

.tool-category-header {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}

.tool-category-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tool-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Consolas', monospace;
  white-space: nowrap;
}

/* ========== 底部控制 ========== */
.metrics-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}

.last-update {
  font-size: 12px;
  color: #9ca3af;
  margin-left: auto;
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metrics-bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
