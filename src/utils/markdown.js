/**
 * Markdown 解析工具
 *
 * 使用 marked + highlight.js 将 AI 输出的 Markdown 文本渲染为 HTML，
 * 支持 GFM（表格、任务列表、删除线）、代码块语法高亮等功能。
 */
import { Marked } from 'marked'
import hljs from 'highlight.js'
// highlight.js 主题（GitHub 风格，适合浅色气泡背景）
import 'highlight.js/styles/github.css'

// ==================== marked 实例（单例） ====================

const marked = new Marked()

// 配置 marked 渲染器：代码块使用 highlight.js 高亮
marked.setOptions({
  breaks: true,       // 单换行也转 <br>（更接近日常聊天体验）
  gfm: true           // 启用 GitHub Flavored Markdown
})

// 自定义 code 渲染器：接入 highlight.js
const renderer = {
  code(codeObj) {
    const lang = codeObj.lang || ''
    const code = codeObj.text || ''

    // 如果有指定语言且 highlight.js 支持，进行高亮
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(code, { language: lang }).value
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`
      } catch {
        // 高亮失败时回退到无高亮代码块
      }
    }

    // 无语言或高亮失败：普通代码块
    const escaped = escapeHtml(code)
    return `<pre><code>${escaped}</code></pre>`
  }
}

marked.use({ renderer })

// ==================== 工具函数 ====================

/**
 * HTML 转义（仅用于代码块回退场景）
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ==================== 导出 ====================

/**
 * 将 Markdown 文本解析为 HTML 字符串
 *
 * @param {string} markdownText - 原始 Markdown 文本
 * @returns {string} 渲染后的 HTML 字符串（不包裹外层容器）
 */
export function renderMarkdown(markdownText) {
  if (!markdownText || typeof markdownText !== 'string') return ''

  // marked.parse 可能返回 string | Promise<string>，这里全部走同步路径
  const result = marked.parse(markdownText)
  // 确保返回值是字符串
  if (result instanceof Promise) {
    // 理论上 marked 同步调用不会返回 Promise，但做防御处理
    return markdownText
  }
  return result
}
