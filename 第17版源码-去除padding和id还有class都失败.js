// ==UserScript==
// @name         【自写】📖小窗净读器Plus（通用适配/目录分页/多页拼合/去除杂乱元素/可拖可调/记忆进度/全局替换/黑暗模式/字体大小/行高设置/可扩展）
// @author       youfengknight
// @namespace    https://github.com/jx-j-x/Greasemonkey-script
// @version      0.11.3
// @description  Ctrl+Alt+L 输入链接→抽正文；Alt+T 目录（每页50条，可跳页）；Ctrl+Alt+R 续读上次；←/→ 翻页/跳章；↑/↓ 平滑滚动；Ctrl+Alt+X 显示/隐藏；Alt+Q打开文本替换；Alt+1刷新当前章节。多站点适配可扩展，跨域抓取（含 GBK/Big5），小窗可拖动/调整大小，自动记忆目录与最后章节链接。
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      *
// @connect      3wwd.com
// @connect      m.3wwd.com
// @connect      biquge.tw
// @connect      www.biquge.tw
// @connect      m.biquge.tw
// @connect      www.dbxsd.com/
// @connect      www.shuzhaige.com/
// @connect      www.beqege.cc/
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ========== 样式 ==========
  GM_addStyle(`
  #cr-panel{
    position: fixed; left: 16px; bottom: 16px; width: 300px; height: 300px;
    background: #fff; color:#222; border:1px solid #ddd; border-radius:10px;
    box-shadow:0 6px 24px rgba(0,0,0,.15); z-index: 2147483646;
    display:none; overflow:hidden; font:14px/1.7 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,"Noto Sans","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  }






  #cr-drag{ position:absolute; top:0; left:0; right:0; height:10px; cursor:move; z-index:3; }
  #cr-resize{
    position:absolute; right:2px; bottom:2px; width:14px; height:14px; cursor:nwse-resize; z-index:3; opacity:.7;
    background:linear-gradient(135deg, rgba(0,0,0,0) 0, rgba(0,0,0,0) 50%, #cfcfcf 50%, #cfcfcf 100%);
    border-radius:3px;
  }
  #cr-content{ height:100%; overflow:auto; padding:12px 14px; position:relative; z-index:1; }
  #cr-content p{ margin:0 0 6px 0; }

  /* URL 输入弹窗 & 目录弹窗 */
  #cr-modal, #cr-toc{
    position: fixed; inset: 0; background: rgba(0,0,0,.35); display:none;
    align-items: center; justify-content: center; z-index: 2147483647;
  }
  #cr-modal .cr-box, #cr-toc .cr-box{
    width: min(800px, 96vw); background:#fff; border-radius:12px;
    box-shadow: 0 10px 30px rgba(0,0,0,.25); padding: 16px;
  }
  #cr-modal h3, #cr-toc h3{ margin:0 0 10px 0; font-size:16px; }
  #cr-url{
    width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px;
    border:1px solid #ddd; border-radius:8px; outline:none;
  }
  #cr-modal .ops{ margin-top:12px; display:flex; gap:8px; justify-content:flex-end; }
  #cr-modal button{ border:1px solid #ddd; background:#fff; border-radius:8px; padding:6px 12px; cursor:pointer; }
  #cr-modal button.primary{ background:#111; color:#fff; border-color:#111; }

  /* 目录弹窗 */
  #cr-toc .cr-box{ padding:12px 12px 8px;}
  .cr-toc-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .cr-toc-head .title{ font-weight:600; }
  .cr-toc-head .close{ border:1px solid #ddd; background:#fff; border-radius:8px; padding:6px 10px; cursor:pointer; }

  .toc-list{
    max-height: 65vh; overflow:auto; border:1px solid #eee; border-radius:8px;
    padding: 6px;
  }
  .toc-item{
    padding:6px 8px; border-radius:6px; cursor:pointer; user-select:none;
    display:flex; gap:10px; align-items:flex-start;
  }
  .toc-item:hover{ background:#f6f6f6; }
  .toc-item.active{ background:#111; color:#fff; }
  .toc-idx{ min-width: 56px; opacity:.7; font-variant-numeric: tabular-nums; }
  .toc-title{ flex:1; word-break: break-all; }

  .cr-toc-foot{
    display:flex; align-items:center; justify-content:space-between;
    margin-top:8px; gap:12px; flex-wrap:wrap;
  }
  .range{ font-size:12px; color:#666; }
  .pager{ display:flex; align-items:center; gap:8px; }
  .pager button{
    border:1px solid #ddd; background:#fff; border-radius:8px; padding:6px 10px; cursor:pointer;
  }
  .pager input{
    width:90px; padding:6px 8px; border:1px solid #ddd; border-radius:8px; outline:none; font-size:14px;
  }



  //以下均为AI增加
   /* 黑暗模式样式 */
  #cr-panel.cr-theme-dark {
    background: #1a1a1a !important;
    color: #e6e6e6 !important;
    border-color: #444 !important;
    box-shadow: 0 6px 24px rgba(0,0,0,0.4);
  }

  #cr-panel.cr-theme-dark #cr-content {
    color: #e6e6e6;
  }

  #cr-panel.cr-theme-dark #cr-content a {
    color: #88c0ff;
  }

  /* 黑暗模式滚动条样式 */
  #cr-panel.cr-theme-dark #cr-content::-webkit-scrollbar {
    width: 8px;
  }

  #cr-panel.cr-theme-dark #cr-content::-webkit-scrollbar-track {
    background: #2a2a2a;
    border-radius: 4px;
  }

  #cr-panel.cr-theme-dark #cr-content::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }

  #cr-panel.cr-theme-dark #cr-content::-webkit-scrollbar-thumb:hover {
    background: #666;
  }

  /* Firefox 滚动条样式 */
  #cr-panel.cr-theme-dark #cr-content {
    scrollbar-width: thin;
    scrollbar-color: #555 #2a2a2a;
  }

  /* 控制按钮样式 */
  .cr-theme-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 6px;
    z-index: 1000;
  }

  .cr-theme-btn {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  #cr-panel.cr-theme-dark .cr-theme-btn {
    background: #000;
    border-color: #555;
    color: #000;
  }

/* 文本替换弹窗样式 ，AI增加*/
#cr-replace-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,.35); display:none;
  align-items: center; justify-content: center; z-index: 2147483647; /* 和其他弹窗同层级 */
}
#cr-replace-modal .cr-box {
  width: min(600px, 96vw); background:#fff; border-radius:12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.25); padding: 16px;
}
#cr-replace-modal h3 { margin:0 0 12px 0; font-size:16px; }
#cr-replace-inputs { display:flex; flex-direction:column; gap:8px; margin-bottom:12px; }
#cr-replace-from, #cr-replace-to {
  width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px;
  border:1px solid #ddd; border-radius:8px; outline:none;
}
#cr-replace-modal .ops { margin-top:8px; display:flex; gap:8px; justify-content:flex-end; }
#cr-replace-modal button { border:1px solid #ddd; background:#fff; border-radius:8px; padding:6px 12px; cursor:pointer; }
#cr-replace-modal button.primary { background:#111; color:#fff; border-color:#111; }
/* 黑暗模式下弹窗适配 */
#cr-panel.cr-theme-dark #cr-replace-modal .cr-box { background:#1a1a1a; color:#e6e6e6; }
#cr-panel.cr-theme-dark #cr-replace-from,
#cr-panel.cr-theme-dark #cr-replace-to { background:#2a2a2a; border-color:#444; color:#e6e6e6; }
#cr-panel.cr-theme-dark #cr-replace-modal button { background:#2a2a2a; border-color:#444; color:#e6e6e6; }
#cr-panel.cr-theme-dark #cr-replace-modal button.primary { background:#333; color:#e6e6e6; }

/* 新增：替换规则列表样式 */
#cr-replace-rules {
  max-height: 180px; overflow-y: auto; margin: 10px 0;
  border: 1px solid #eee; border-radius: 8px; padding: 8px;
}
.cr-replace-rule-item {
  display: flex; align-items: center; gap: 8px; padding: 6px;
  border-radius: 4px; margin-bottom: 4px; background: #f9f9f9;
}
.cr-replace-rule-text {
  flex: 1; font-size: 13px; color: #333;
}
.cr-replace-rule-del {
  border: none; background: #ff4444; color: #fff;
  border-radius: 4px; padding: 2px 6px; cursor: pointer;
  font-size: 12px;
}
/* 黑暗模式适配规则列表 */
#cr-panel.cr-theme-dark #cr-replace-rules {
  border-color: #444;
}
#cr-panel.cr-theme-dark .cr-replace-rule-item {
  background: #2a2a2a;
}
#cr-panel.cr-theme-dark .cr-replace-rule-text {
  color: #e6e6e6;
}

/* 右键刷新菜单样式 */
#cr-refresh-menu {
  position: fixed; background: #fff; border: 1px solid #ddd;
  border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.15);
  padding: 4px 0; z-index: 99999; display: none;
}
#cr-refresh-menu .menu-item {
  padding: 6px 16px; font-size: 14px; cursor: pointer;
  white-space: nowrap; color: #333;
}
#cr-refresh-menu .menu-item:hover {
  background: #f5f5f5;
}
/* 黑暗模式适配 */
#cr-panel.cr-theme-dark #cr-refresh-menu {
  background: #1a1a1a; border-color: #444;
}
#cr-panel.cr-theme-dark #cr-refresh-menu .menu-item {
  color: #e6e6e6;
}
#cr-panel.cr-theme-dark #cr-refresh-menu .menu-item:hover {
  background: #2a2a2a;
}

  /* ========== 新增：设置面板样式 ========== */
  #cr-settings-modal {
    position: fixed; inset: 0; background: rgba(0,0,0,.35); display:none;
    align-items: center; justify-content: center; z-index: 2147483647; /* 和其他弹窗同层级 */
  }
  #cr-settings-modal .cr-box {
    width: min(400px, 96vw); background:#fff; border-radius:12px;
    box-shadow: 0 10px 30px rgba(0,0,0,.25); padding: 16px;
  }
  #cr-settings-modal h3 { margin:0 0 16px 0; font-size:16px; }
  .cr-settings-item {
    display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;
  }
  .cr-settings-item label {
    font-size: 14px; color: #666;
  }
  .cr-settings-input {
    width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px;
    border:1px solid #ddd; border-radius:8px; outline:none;
  }
  #cr-settings-modal .ops {
    margin-top: 8px; display:flex; gap:8px; justify-content:flex-end;
  }
  #cr-settings-modal button {
    border:1px solid #ddd; background:#fff; border-radius:8px; padding:6px 12px; cursor:pointer;
  }
  #cr-settings-modal button.primary {
    background:#111; color:#fff; border-color:#111;
  }
  /* 黑暗模式适配设置面板 */
  #cr-panel.cr-theme-dark #cr-settings-modal .cr-box {
    background:#1a1a1a; color:#e6e6e6;
  }
  #cr-panel.cr-theme-dark .cr-settings-item label {
    color:#bbb;
  }
  #cr-panel.cr-theme-dark .cr-settings-input {
    background:#2a2a2a; border-color:#444; color:#e6e6e6;
  }
  #cr-panel.cr-theme-dark #cr-settings-modal button {
    background:#2a2a2a; border-color:#444; color:#e6e6e6;
  }
  #cr-panel.cr-theme-dark #cr-settings-modal button.primary {
    background:#333; color:#e6e6e6;
  }

/* 新增：章节标题基础样式 */
  .cr-chapter-title {
    margin: 10px 0 8px 0 !important; /* 上10px，下8px，减小与正文间距 */
    padding-bottom: 6px !important;
    border-bottom: 1px solid #ddd !important; /* 白天模式下划线（比原来深一点） */
    font-size: 18px !important; /* 确保标题字号合适 */
  }

  /* 黑暗模式标题样式 */
  #cr-panel.cr-theme-dark .cr-chapter-title {
    border-bottom: 1px solid #555 !important; /* 深色模式下划线（更明显） */
    color: #f0f0f0 !important; /* 确保标题文字在深色背景可见 */
  }

  /* 正文段落样式调整（减小与标题间距） */
  #cr-content p:first-of-type {
    margin-top: 8px !important; /* 正文第一段顶部间距减小 */
  }

  `);

  // ========== DOM ==========
  const panel = document.createElement('div');
  panel.id = 'cr-panel';
  panel.innerHTML = `
    <div id="cr-drag" title="按住上沿拖动"></div>
    <div id="cr-resize" title="拖动调整大小"></div>
    <div id="cr-content"><div style="color:#888">Ctrl+Alt+L 输入链接；Alt+T 目录；Ctrl+Alt+R 续读上次；←/→ 翻页或跳章；↑/↓ 平滑滚动；Ctrl+Alt+X 显示/隐藏。可拖动小窗，右下角可调大小。</div></div>
  `;
  document.documentElement.appendChild(panel);

  const modal = document.createElement('div');
  modal.id = 'cr-modal';
  modal.innerHTML = `
    <div class="cr-box">
      <h3>输入章节链接</h3>
      <input id="cr-url" type="url" placeholder="https://…" spellcheck="false" />
      <div class="ops">
        <button id="cr-cancel">取消(Esc)</button>
        <button id="cr-confirm" class="primary">开始(Enter)</button>
      </div>
    </div>
  `;
  document.documentElement.appendChild(modal);

  const toc = document.createElement('div');
  toc.id = 'cr-toc';
  toc.innerHTML = `
    <div class="cr-box">
      <div class="cr-toc-head">
        <div class="title">目录</div>
        <button class="close" id="cr-toc-close">关闭(Esc)</button>
      </div>
      <div class="toc-list" id="cr-toc-list"></div>
      <div class="cr-toc-foot">
        <div class="range" id="cr-toc-range">—</div>
        <div class="pager">
          <button id="cr-toc-prev">上一页</button>
          <button id="cr-toc-next">下一页</button>
          <span>跳转页：</span>
          <input type="number" id="cr-toc-goto" min="1" step="1" />
          <button id="cr-toc-go">跳</button>
        </div>
      </div>
    </div>
  `;
  document.documentElement.appendChild(toc);

  const $ = (sel, root = document) => root.querySelector(sel);
  const contentEl = $('#cr-content', panel);
  const urlInput = $('#cr-url', modal);
  const tocListEl = $('#cr-toc-list', toc);
  const tocRangeEl = $('#cr-toc-range', toc);
  const tocGotoEl = $('#cr-toc-goto', toc);
  const dragEl = $('#cr-drag', panel);
  const resizeEl = $('#cr-resize', panel);








    //AI增加刷新
    // 2. 核心：刷新当前章节函数（复用现有抓取逻辑）
    function refreshCurrentChapter() {
        // 校验：当前有章节内容且未加载中
        if (state.loading || !state.pages || state.pages.length === 0) {
            alert('当前无章节可刷新或正在加载中！');
            return;
        }
        // 获取当前章节的 URL（从已加载的页面中取）
        const currentChapterUrl = state.pages[state.pageIndex].url;
        // 调用现有函数重新抓取（自动覆盖旧内容+应用替换规则）
        fetchChapterSeries(currentChapterUrl);
        // 隐藏右键菜单（如果显示中）
        //  refreshMenu.style.display = 'none';
    }


    //AI增加替换窗口
    // 文本替换弹窗（新增）
// 文本替换弹窗（重写：加规则列表）
const replaceModal = document.createElement('div');
replaceModal.id = 'cr-replace-modal';
replaceModal.innerHTML = `
  <div class="cr-box">
    <h3>文本替换（Alt+Q 打开）</h3>
    <!-- 新增：已添加的替换规则列表 -->
    <div id="cr-replace-rules-title" style="font-size:13px; color:#666; margin:8px 0 4px;">
      已生效规则（所有章节自动替换）：
    </div>
    <div id="cr-replace-rules"></div>

    <!-- 替换输入框 -->
    <div id="cr-replace-inputs">
      <input type="text" id="cr-replace-from" placeholder="输入要替换的原文本" spellcheck="false">
      <input type="text" id="cr-replace-to" placeholder="输入替换后的文本" spellcheck="false">
    </div>

    <div class="ops">
      <button id="cr-replace-cancel">取消(Esc)</button>
      <button id="cr-replace-confirm" class="primary">添加并应用</button>
    </div>
  </div>
`;
document.documentElement.appendChild(replaceModal);

// 替换弹窗元素获取（新增规则列表元素）
const replaceFrom = $('#cr-replace-from', replaceModal);
const replaceTo = $('#cr-replace-to', replaceModal);
const replaceRulesList = $('#cr-replace-rules', replaceModal); // 规则列表容器

//新弹窗事件绑定代码
    // 【这是新代码，粘贴到旧代码的位置】
// 改造：替换弹窗事件绑定（用新的 addReplaceRule 逻辑）
$('#cr-replace-cancel', replaceModal).addEventListener('click', closeReplaceModal);
$('#cr-replace-confirm', replaceModal).addEventListener('click', addReplaceRule);

// 输入框快捷键：Enter 确认添加规则，Esc 关闭弹窗
replaceFrom.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); replaceTo.focus(); } // 先切到目标文本框
  if (e.key === 'Escape') { e.preventDefault(); closeReplaceModal(); }
});
replaceTo.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); addReplaceRule(); } // 按 Enter 保存规则
  if (e.key === 'Escape') { e.preventDefault(); closeReplaceModal(); }
});

// 替换弹窗全局 Esc 关闭（和其他弹窗保持一致）
replaceModal.addEventListener('keydown', (e) => {
  if (!state1.modalOpen) return;
  if (e.key === 'Escape') { e.preventDefault(); closeReplaceModal(); }
});

    //AI增加结束




  // ========== 新增：设置面板DOM ==========
// 修改设置面板DOM结构，改为左右分栏布局
const settingsModal = document.createElement('div');
settingsModal.id = 'cr-settings-modal';
settingsModal.innerHTML = `
  <div class="cr-box">
    <h3>阅读设置（Alt+A 打开）</h3>
    <div class="cr-settings-container">
      <!-- 左侧选项栏 -->
      <div class="cr-settings-sidebar">
        <div class="cr-settings-item-option active" data-tab="font-settings">字体/行高设置</div>
        <div class="cr-settings-item-option" data-tab="background-settings">背景设置</div>
      </div>

      <!-- 右侧内容区 -->
      <div class="cr-settings-content">
        <!-- 字体/行高设置面板 -->
        <div class="cr-settings-panel active" id="font-settings">
          <div class="cr-settings-item">
            <label for="cr-settings-fontsize">字号（12-24px，默认14px）</label>
            <input type="number" id="cr-settings-fontsize" class="cr-settings-input" min="12" max="24" step="1" value="14">
          </div>
          <div class="cr-settings-item">
            <label for="cr-settings-lineheight">行高（1.2-2.5，默认1.7）</label>
            <input type="number" id="cr-settings-lineheight" class="cr-settings-input" min="1.2" max="2.5" step="0.1" value="1.7">
          </div>
        </div>

        <!-- 背景设置面板（暂未实现功能） -->
        <div class="cr-settings-panel" id="background-settings">
          <div class="cr-settings-placeholder">
            背景设置功能正在开发中...
          </div>
        </div>
      </div>
    </div>
    <div class="ops">
      <button id="cr-settings-cancel">取消(Esc)</button>
      <button id="cr-settings-confirm" class="primary">保存并应用</button>
    </div>
  </div>
`;
document.documentElement.appendChild(settingsModal);

  // 新增：获取设置面板输入框元素（和其他元素选择器放一起）
  const settingsFontSizeEl = $('#cr-settings-fontsize', settingsModal);
  const settingsLineHeightEl = $('#cr-settings-lineheight', settingsModal);



// 添加新的样式
GM_addStyle(`
  .cr-settings-container {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    min-height: 200px;
  }

  .cr-settings-sidebar {
    width: 140px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .cr-settings-item-option {
    padding: 12px 16px;
    cursor: pointer;
    font-size: 14px;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
  }

  .cr-settings-item-option:last-child {
    border-bottom: none;
  }

  .cr-settings-item-option:hover {
    background-color: #f5f5f5;
  }

  .cr-settings-item-option.active {
    background-color: #f0f0f0;
    font-weight: 600;
    border-left: 3px solid #111;
  }

  .cr-settings-content {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
  }

  .cr-settings-panel {
    display: none;
  }

  .cr-settings-panel.active {
    display: block;
  }

  .cr-settings-placeholder {
    color: #666;
    padding: 30px 0;
    text-align: center;
    font-size: 14px;
  }

  /* 黑暗模式适配 */
  #cr-panel.cr-theme-dark .cr-settings-sidebar,
  #cr-panel.cr-theme-dark .cr-settings-content {
    border-color: #444;
  }

  #cr-panel.cr-theme-dark .cr-settings-item-option {
    border-bottom-color: #444;
    color: #e6e6e6;
  }

  #cr-panel.cr-theme-dark .cr-settings-item-option:hover {
    background-color: #2a2a2a;
  }

  #cr-panel.cr-theme-dark .cr-settings-item-option.active {
    background-color: #333;
    border-left-color: #ccc;
  }

  #cr-panel.cr-theme-dark .cr-settings-placeholder {
    color: #999;
  }
`);

// 修改设置面板事件绑定，添加选项切换功能
// 获取新的元素
const settingsOptions = document.querySelectorAll('.cr-settings-item-option');
const settingsPanels = document.querySelectorAll('.cr-settings-panel');

// 切换设置面板
function switchSettingsPanel(tabId) {
  // 更新选项激活状态
  settingsOptions.forEach(option => {
    option.classList.toggle('active', option.dataset.tab === tabId);
  });

  // 更新面板显示状态
  settingsPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

// 绑定选项点击事件
settingsOptions.forEach(option => {
  option.addEventListener('click', () => {
    switchSettingsPanel(option.dataset.tab);
  });
});



  // ========== 新增：设置面板事件绑定 ==========
  // 打开设置面板
 // 修改打开设置面板函数，确保默认显示第一个面板
function openSettingsModal() {
  state1.settingsModalOpen = true;
  showPanel(); // 显示阅读小窗
  settingsModal.style.display = 'flex';
  // 同步当前设置到输入框
  settingsFontSizeEl.value = state1.fontSize;
  settingsLineHeightEl.value = state1.lineHeight;
  // 确保默认显示第一个面板
  switchSettingsPanel('font-settings');
  settingsFontSizeEl.focus(); // 自动聚焦到字号输入框
}

  // 关闭设置面板
  function closeSettingsModal() {
    state1.settingsModalOpen = false;
    settingsModal.style.display = 'none';
  }
  // ========== 修改：保存设置处理函数 ==========
function saveSettingsHandler() {
  const inputFontSize = parseInt(settingsFontSizeEl.value, 10);
  const inputLineHeight = parseFloat(settingsLineHeightEl.value);

  // 校验输入合法性
  if (isNaN(inputFontSize) || inputFontSize <12 || inputFontSize >24) {
    alert('请输入12-24之间的字号！');
    settingsFontSizeEl.focus();
    return;
  }
  if (isNaN(inputLineHeight) || inputLineHeight <1.2 || inputLineHeight >2.5) {
    alert('请输入1.2-2.5之间的行高！');
    settingsLineHeightEl.focus();
    return;
  }

  // 更新状态并保存
  state1.fontSize = inputFontSize;
  state1.lineHeight = inputLineHeight;
  saveSettings();
  applySettings(); // 立即应用新设置
  closeSettingsModal();
  alert('设置已保存并应用！');
  }

  // 绑定按钮点击事件
  $('#cr-settings-cancel', settingsModal).addEventListener('click', closeSettingsModal);
  $('#cr-settings-confirm', settingsModal).addEventListener('click', saveSettingsHandler);
  // 输入框快捷键：Enter保存，Esc关闭
  settingsFontSizeEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); settingsLineHeightEl.focus(); }
    if (e.key === 'Escape') { e.preventDefault(); closeSettingsModal(); }
  });
  settingsLineHeightEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveSettingsHandler(); }
    if (e.key === 'Escape') { e.preventDefault(); closeSettingsModal(); }
  });
  // 面板全局Esc关闭
  settingsModal.addEventListener('keydown', (e) => {
    if (!state1.settingsModalOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeSettingsModal(); }
  });










  // ========== 状态 ==========
  const state = {
    visible: false,
    modalOpen: false,
    seriesId: null,
    pages: [],
    pageIndex: 0,
    nextChapterUrl: null,
    prevChapterUrl: null,
    loading: false,

    profile: null,          // 当前命中的站点 profile
    bookBase: null,         // 当前书籍基准路径
    tocUrl: null,
    tocItems: [],
    tocPage: 0,
    tocPageSize: 50,

    dragging: false, dragDX: 0, dragDY: 0,
    resizing: false, startW: 0, startH: 0, startX: 0, startY: 0,
  };

    //AI增加

    const state1 = {
        visible: false,
        modalOpen: false,
        // ... 原有其他状态 ...
        // 新增：替换规则存储（数组，存多组 {from, to}）
        replaceRules: [],
        // 新增：标记是否已加载本地存储的规则（避免重复加载）
        replaceRulesLoaded: false,
        // ========== 新增：设置面板状态 + 字号/行高配置 ==========
        settingsModalOpen: false, // 标记设置面板是否打开
        fontSize: 14,             // 默认字号（12-24px）
        lineHeight: 1.7           // 默认行高（1.2-2.5）
    };


 // ========== 黑暗模式功能 ==========
function addDarkModeFeature() {
  // 创建主题切换按钮容器
  const themeControls = document.createElement('div');
  themeControls.className = 'cr-theme-controls';
  themeControls.style.cssText = `
    position: absolute;
    top: 10px;
    right: 18px;
    display: flex;
    gap: 6px;
    z-index: 1000;
  `;
  // 主题按钮（🌞亮色 / 🌙黑暗）
  themeControls.innerHTML = `
    <button class="cr-theme-btn" data-theme="light" title="亮色模式">🌞</button>
    <button class="cr-theme-btn" data-theme="dark" title="黑暗模式">🌙</button>
  `;
  panel.appendChild(themeControls);

  // 主题切换逻辑（修改后）
  function setTheme(theme) {
    // 1. 强制添加/移除黑暗模式类名
    panel.classList.toggle('cr-theme-dark', theme === 'dark');

    // 2. 内联样式兜底（防止 CSS 失效）
    if (theme === 'dark') {
      panel.style.background = '#1a1a1a';
      panel.style.color = '#e6e6e6';
      panel.style.borderColor = '#444';
    } else {
      panel.style.background = '#fff';
      panel.style.color = '#222';
      panel.style.borderColor = '#ddd';
    }

    // 3. 保存主题到本地
    localStorage.setItem('cr_theme', theme);

    // 4. 更新按钮状态（修复文字颜色）
    themeControls.querySelectorAll('.cr-theme-btn').forEach(btn => {
      const isActive = btn.dataset.theme === theme;
      btn.style.opacity = isActive ? '1' : '0.6';
      btn.style.fontWeight = isActive ? 'bold' : 'normal';
      btn.style.color = theme === 'dark' ? '#e6e6e6' : '#000';
    });
  }

  // 绑定按钮点击事件
  themeControls.querySelectorAll('.cr-theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止事件冒泡影响其他功能
      setTheme(btn.dataset.theme);
    });
  });

  // 恢复本地保存的主题（原逻辑保留）
  const savedTheme = localStorage.getItem('cr_theme') || 'light';
  setTheme(savedTheme);
}
//AI增加截止







  // ========== Profiles（站点适配表） ==========
  const PROFILES = [
    // --- 3wwd.com ---
    {
      id: '3wwd',
      test: (url) => /(^|\.)3wwd\.com$/i.test(new URL(url).hostname),
      deriveBookBase: (url) => {
        const u = new URL(url);
        const m = u.pathname.match(/^(.*?\/book_\d+\/)/);
        if (m) return new URL(m[1], u.origin).href;
        return generic.deriveBookBase(url);
      },
      tocContainers: ['#list', '.box_con #list'],
      isChapterLink: (abs, bookBase) => sameBook(abs, bookBase) && /\/\d+(?:_\d+)?\.html(?:[#?].*)?$/i.test(abs),
      extractContent: (doc, baseUrl) => preferFirst(doc, [
        '#content', '#chaptercontent', '#chapterContent', '.content', '.read-content', '#contentTxt', '#BookText', '#txtContent'
      ], baseUrl),
      findInfoUrl: (doc, baseUrl, entry) => {
        const el = doc.querySelector('#info_url');
        if (el) return absolutize(baseUrl, el.getAttribute('href') || '');
        return generic.findInfoUrl(doc, baseUrl, entry);
      },
      findNav: (doc, baseUrl) => generic.findNav(doc, baseUrl),
    },

    // --- biquge.tw / www.biquge.tw / m.biquge.tw ---
    {
      id: 'biquge-tw',
      test: (url) => /(^|\.)(biquge\.tw)$/i.test(new URL(url).hostname.replace(/^www\./,'')),
      deriveBookBase: (url) => {
        const u = new URL(url);
        const m = u.pathname.match(/^(.*?\/book\/\d+\/)/);
        if (m) return new URL(m[1], u.origin).href; // 形如 https://www.biquge.tw/book/2319336/
        return generic.deriveBookBase(url);
      },
      tocContainers: ['#list', '.listmain', '#chapterlist', '.chapterlist', '#listmain', '#chapters', '.chapters'],
      isChapterLink: (abs, bookBase) => sameBook(abs, bookBase) && /\/book\/\d+\/\d+(?:_\d+)?\.html(?:[#?].*)?$/i.test(abs),
      extractContent: (doc, baseUrl) => preferFirst(doc, [
        '#content', '#chaptercontent', '#chapterContent', '.content', '.read-content', '#contentTxt', '#BookText', '#txtContent'
      ], baseUrl),
      findInfoUrl: (doc, baseUrl, entry) => {
        // biquge.tw 正文页一般没有明确“目录”按钮，直接回落到书籍根
        return generic.deriveBookBase(entry);
      },
      findNav: (doc, baseUrl) => generic.findNav(doc, baseUrl),
      tocCandidates: (base) => {
        // biquge 常见目录页：/book/<id>/、/book/<id>/index.html、也有 all.html
        const out = [];
        const b = base.replace(/\/?$/,'/');
        out.push(b);
        out.push(b + 'index.html');
        out.push(b + 'all.html');
        try {
          const u = new URL(b);
          if (u.hostname.startsWith('www.')) {
            const mu = new URL(b); mu.hostname = 'm.' + u.hostname.slice(4); out.push(mu.href); out.push(mu.href + 'index.html');
          } else if (u.hostname.startsWith('m.')) {
            const wu = new URL(b); wu.hostname = 'www.' + u.hostname.slice(2); out.push(wu.href); out.push(wu.href + 'index.html');
          }
        } catch {}
        return Array.from(new Set(out));
      }
    },

    // --- 通用兜底（最后一项） ---
    {
      id: 'generic',
      test: (_url) => true,
      deriveBookBase: (url) => generic.deriveBookBase(url),
      tocContainers: ['#list', '.listmain', '#listmain', '#chapterlist', '.chapterlist', '#chapters', '.chapters', '.volume', '.mulu'],
      isChapterLink: (abs, bookBase) => sameBook(abs, bookBase) && /\/\d+(?:_\d+)?\.html(?:[#?].*)?$/i.test(abs),
      extractContent: (doc, baseUrl) => preferFirst(doc, [
        '#content', '#chaptercontent', '#chapterContent', '.content', '.read-content', '#contentTxt', '#BookText', '#txtContent'
      ], baseUrl),
      findInfoUrl: (doc, baseUrl, entry) => generic.findInfoUrl(doc, baseUrl, entry),
      findNav: (doc, baseUrl) => generic.findNav(doc, baseUrl)
    }
  ];

  // ========== 通用实现 ==========
  const generic = {
    deriveBookBase(url) {
      try {
        const u = new URL(url);
        const m1 = u.pathname.match(/^(.*?\/book_\d+\/)/);
        if (m1) return new URL(m1[1], u.origin).href;
        const m2 = u.pathname.match(/^(.*?\/book\/\d+\/)/);
        if (m2) return new URL(m2[1], u.origin).href;
        const p = u.pathname.endsWith('/') ? u.pathname : u.pathname.replace(/[^/]+$/, '');
        return new URL(p, u.origin).href;
      } catch { return null; }
    },
    findInfoUrl(doc, baseUrl, entryUrl) {
      const el = doc.querySelector('#info_url');
      if (el) return absolutize(baseUrl, el.getAttribute('href') || '');
      const hint = Array.from(doc.querySelectorAll('a')).find(a => /(目录|章节目录|返回书页|返回目录)/.test((a.textContent || '').trim()));
      if (hint) return absolutize(baseUrl, hint.getAttribute('href') || '');
      return generic.deriveBookBase(entryUrl);
    },
    findNav(doc, baseUrl) {
      const norm = (u)=>u ? absolutize(baseUrl, u) : null;
      let prev = safeHref(doc.querySelector('#prev_url')?.getAttribute('href') || '');
      let next = safeHref(doc.querySelector('#next_url')?.getAttribute('href') || '');
      if (!prev) { const c = Array.from(doc.querySelectorAll('a')).find(a => /上[一页一章]/.test((a.textContent || '').trim())); if (c) prev = safeHref(c.getAttribute('href') || ''); }
      if (!next) { const anchors = Array.from(doc.querySelectorAll('a')); const c = anchors.reverse().find(a => /下[一页一章]/.test((a.textContent || '').trim())); if (c) next = safeHref(c.getAttribute('href') || ''); }
      return { prev: prev ? norm(prev) : null, next: next ? norm(next) : null };
    }
  };

  // ========== 工具 ==========
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  function absolutize(base, href) { try { return new URL(href, base).href; } catch { return href; } }
  function safeHref(href) {
    if (!href) return null;
    if (/^\s*javascript:/i.test(href)) return null;
    if (href.trim() === '#') return null;
    return href;
  }
  function getSeriesIdFromUrl(url) { try { const m = new URL(url).pathname.match(/(\d+)(?:_(\d+))?\.html$/); return m ? m[1] : null; } catch { return null; } }
  function isSameChapterPage(u1, u2) { const a = getSeriesIdFromUrl(u1), b = getSeriesIdFromUrl(u2); return a && b && a === b; }
  function sameBook(hrefAbs, bookBase) {
    try {
      const u = new URL(hrefAbs), b = new URL(bookBase);
      return u.origin === b.origin && u.pathname.startsWith(b.pathname);
    } catch { return false; }
  }
  function chapterIdFromHref(href) {
    try { const m = href.match(/\/(\d+)(?:_\d+)?\.html/); return m ? m[1] : null; } catch { return null; }
  }
  function chooseProfile(url) {
    for (const p of PROFILES) { try { if (p.test(url)) return p; } catch {} }
    return PROFILES[PROFILES.length-1];
  }

  // 1. 优化标题提取逻辑（在preferFirst函数中）
// 修改preferFirst函数，实现标题暂存与 fallback 逻辑
// 修改preferFirst函数，增加正文内容中章节标题的检测
function preferFirst(doc, selList, baseUrl) {
    // 1. 暂存所有h1、h2标签文本（去重且非空）
    const titleCandidates = new Set();
    [...doc.querySelectorAll('h1, h2')].forEach(el => {
        const text = el.textContent.trim();
        if (text) titleCandidates.add(text);
    });
    const storedTitles = Array.from(titleCandidates);

    // 2. 章节标题正则（调整为非严格匹配，用于检测正文中的标题）
    const chapterTitleReg = /第(?:[一二三四五六七八九十百千]{1,5}|[1-9]\d{0,3})[章卷节回集]/;

    // 3. 先尝试提取正文内容（用于后续检测）
    let contentHtml = '';
    let contentText = '';
    let hasBodyChapterTitle = false;

    // 提取正文并检查是否包含章节标题
// 1. 处理通过selList找到的正文容器
for (const sel of selList) {
    const node = doc.querySelector(sel);
    if (node) {
        const cleanNode = node.cloneNode(true);
        // 第一步：先清除padding样式（确保在移除广告等操作前执行）
        cleanElement(cleanNode);
        try {
            // 再移除广告等无用元素
            cleanNode.querySelectorAll('script,style,ins,.ad').forEach(e => e.remove());
        } catch {}
        contentHtml = cleanContentNode(cleanNode, baseUrl);
        // 新增：移除正文中匹配的章节标题文本
        // 关键修改：匹配“第x章”及后续所有文字并移除
        contentHtml = contentHtml.replace(/第(?:[一二三四五六七八九十百千]{1,5}|[1-9]\d{0,3})[章卷节回集].*/g, '');
        contentText = cleanNode.textContent || '';
        hasBodyChapterTitle = chapterTitleReg.test(contentText);
        break;
    }
}

// 如果没找到正文容器，用body内容检测
// 2. 处理body作为正文容器的情况
if (!contentHtml) {
    const body = doc.body.cloneNode(true);
    try {
        // 先移除广告等无用元素
        body.querySelectorAll('script,style,ins,.adsbygoogle,.ad,[class*="ad-"],.advert,[id^="hm_t_"],.recommend,.toolbar').forEach(e => e.remove());
        // 新增：清除所有元素的内联padding样式
        cleanElement(body);
    } catch {}
    contentText = (body.textContent || '').trim();
    hasBodyChapterTitle = chapterTitleReg.test(contentText);
    contentHtml = contentText.replace(/\n{2,}/g, '</p><p>');
    // 新增：移除正文中匹配的章节标题文本
     // 关键修改：匹配“第x章”及后续所有文字并移除
    contentHtml = contentHtml.replace(/第(?:[一二三四五六七八九十百千]{1,5}|[1-9]\d{0,3})[章卷节回集].*/g, '');
    contentHtml = contentHtml ? `<p>${contentHtml}</p>` : '<p>（未找到正文容器）</p>';
}
    // 4. 检查标题标签中是否有符合的章节标题
    const validTitleEl = [...doc.querySelectorAll('h1, h2')].find(el => {
        const text = el.textContent.trim();
        return chapterTitleReg.test(text);
    });

    let titleHtml = '';
    // 只有当标题标签和正文中都没有章节标题时，才使用暂存标题
    if (!validTitleEl && !hasBodyChapterTitle && storedTitles.length > 0) {
        // 优先选择可能包含章节信息的暂存标题
        const fallbackTitle = storedTitles.find(title =>
            chapterTitleReg.test(title)
        ) || storedTitles[0];
        titleHtml = `<h2 class="cr-chapter-title">${fallbackTitle}</h2>`;
    } else if (validTitleEl) {
        // 标题标签中有符合的章节标题，正常使用
        const cleanTitle = validTitleEl.cloneNode(true);
        try {
            cleanTitle.querySelectorAll('script,style,ins,.ad').forEach(e => e.remove());
        } catch {}
        titleHtml = `<h2 class="cr-chapter-title">${cleanTitle.textContent.trim()}</h2>`;
    }

    // 拼接标题和正文并返回
    return titleHtml + contentHtml;
}


function cleanContentNode(node, baseUrl) {
  const n = node.cloneNode(true);

  // 辅助函数：递归移除空元素（无文字内容的元素）
  function removeEmptyElements(el) {
    // 遍历所有子元素（反向遍历，避免删除元素后索引错乱）
    for (let i = el.children.length - 1; i >= 0; i--) {
      const child = el.children[i];
      // 递归处理子元素的子元素
      removeEmptyElements(child);

      // 计算元素的纯文本内容（去除所有空白字符）
      const textContent = child.textContent.trim();
      // 判断是否为空元素：无文本内容，且不是有意义的空标签（如img、br等）
      const isEmpty = textContent === '';
      const isMeaningfulEmptyTag = ['IMG', 'BR', 'HR', 'INPUT'].includes(child.tagName);

      if (isEmpty && !isMeaningfulEmptyTag) {
        // 移除空元素
        child.remove();
      }
    }
  }

  try {
    // 1. 移除广告及无关元素（保留原有逻辑）
    n.querySelectorAll('script,style,ins,.adsbygoogle,.ad,[class*="ad-"],.advert,[id^="hm_t_"],.recommend,.toolbar').forEach(e => e.remove());

    // 2. 移除h1、h2标签（保留文本）
    n.querySelectorAll('h1, h2').forEach(header => {
      const textNode = document.createTextNode(header.textContent + '\n\n');
      header.parentNode.replaceChild(textNode, header);
    });

    // 3. 处理超链接（保留文本，移除链接属性）
    n.querySelectorAll('a').forEach(a => {
      const textNode = document.createTextNode(a.textContent);
      a.parentNode.replaceChild(textNode, a);
    });

    // 4. 处理图片（保留原有逻辑）
    n.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      try { img.src = new URL(src, baseUrl).href; } catch { img.src = src; }
      img.style.maxWidth = '100%';
    });

    // 5. 移除导航文字（保留原有逻辑）
    const navKeywords = /上一章|下一章|上一页|下一页|返回目录|章节列表|首页|尾页/;
    n.querySelectorAll('*').forEach(el => {
      if (navKeywords.test(el.textContent.trim())) {
        el.remove();
      }
    });

    // 6. 新增：递归移除所有空元素（无文字内容的元素）
    removeEmptyElements(n);

  } catch (err) {
    console.error('内容清理出错:', err);
  }

  return n.innerHTML || '<p>（正文为空）</p>';
}

    // ========== 新增工具函数：清除元素内联padding样式 ==========
 //========== 优化：清除元素内联padding样式（覆盖所有相关属性） ==========
//去除抓取元素的id和class，防止它们受到网页原本的css影响，但是去除不了
function cleanElement(node) {
    if (!node) return;

    // 克隆节点以避免修改原 DOM
    const cleanNode = node.cloneNode(true);

    // 清除 class 属性
    cleanNode.className = '';
    cleanNode.id = '';

    // 清除 padding 样式
    cleanNode.style.padding = '0';
    cleanNode.style.paddingTop = '0';
    cleanNode.style.paddingRight = '0';
    cleanNode.style.paddingBottom = '0';
    cleanNode.style.paddingLeft = '0';

    // 递归处理所有子元素
    if (cleanNode.hasChildNodes()) {
        Array.from(cleanNode.childNodes).forEach(child => {
            if (child.nodeType === 1) { // 只处理元素节点
                cleanElement(child);
            }
        });
    }

    // 返回处理后的节点
    return cleanNode;
}











  // ========== 存储 ==========

    //AI增加
    // 新增：保存替换规则到本地存储
function saveReplaceRules() {
  try {
    localStorage.setItem('cr_replace_rules', JSON.stringify(state1.replaceRules));
  } catch (e) {
    console.error('保存替换规则失败：', e);
  }
}

// 新增：从本地存储加载替换规则
function loadReplaceRules() {
  if (state1.replaceRulesLoaded) return; // 避免重复加载
  try {
    const raw = localStorage.getItem('cr_replace_rules');
    if (raw) {
      state1.replaceRules = JSON.parse(raw).filter(rule =>
        rule.from && rule.from.trim() // 过滤空规则
      );
    }
    state1.replaceRulesLoaded = true;
    renderReplaceRulesList(); // 加载后更新弹窗规则列表
  } catch (e) {
    console.error('加载替换规则失败：', e);
    state1.replaceRules = [];
    state1.replaceRulesLoaded = true;
  }
}

// 新增：渲染替换规则列表（弹窗中显示已添加的规则）
function renderReplaceRulesList() {
  if (!replaceRulesList) return;

  // 无规则时显示提示
  if (state1.replaceRules.length === 0) {
    replaceRulesList.innerHTML = `
      <div style="text-align:center; color:#999; font-size:13px; padding:15px 0;">
        暂无替换规则，添加后将对所有章节生效
      </div>
    `;
    return;
  }

  // 渲染已有的规则（带删除按钮）
  replaceRulesList.innerHTML = state1.replaceRules.map((rule, index) => `
    <div class="cr-replace-rule-item">
      <div class="cr-replace-rule-text">
        「${escapeHTML(rule.from)}」→「${escapeHTML(rule.to)}」
      </div>
      <button class="cr-replace-rule-del" data-index="${index}">删除</button>
    </div>
  `).join('');

  // 绑定删除规则事件
  // 绑定删除规则事件（完整修复版）
replaceRulesList.querySelectorAll('.cr-replace-rule-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      state1.replaceRules.splice(index, 1); // 删除对应规则
      saveReplaceRules(); // 保存到本地
      renderReplaceRulesList(); // 刷新列表
      applyAllReplaceRules(); // 立即对当前章生效（删除后更新内容）
    });
  });
}
    //AI增加完成



      // ========== 新增：设置存储（字号/行高） ==========
  const LS_KEY_SETTINGS = 'cr_reader_settings'; // 本地存储键名
  // 保存设置到localStorage
  function saveSettings() {
    try {
      const settings = {
        fontSize: state1.fontSize,
        lineHeight: state1.lineHeight
      };
      localStorage.setItem(LS_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('保存阅读设置失败：', e);
    }
  }
  // 从localStorage加载设置
  function loadSettings() {
    try {
      const raw = localStorage.getItem(LS_KEY_SETTINGS);
      if (raw) {
        const saved = JSON.parse(raw);
        // 校验数值合法性（防止异常值）
        if (saved.fontSize && saved.fontSize >=12 && saved.fontSize <=24) {
          state1.fontSize = saved.fontSize;
        }
        if (saved.lineHeight && saved.lineHeight >=1.2 && saved.lineHeight <=2.5) {
          state1.lineHeight = saved.lineHeight;
        }
      }
      // 同步设置到输入框
      settingsFontSizeEl.value = state1.fontSize;
      settingsLineHeightEl.value = state1.lineHeight;
      // 立即应用设置到正文
      applySettings();
    } catch (e) {
      console.error('加载阅读设置失败：', e);
      // 加载失败用默认值
      state1.fontSize = 14;
      state1.lineHeight = 1.7;
    }
  }

// ========== 修正：应用设置到“网页正文内容”（而非脚本UI） ==========
// ========== 修正：应用设置到正文内容 ==========
function applySettings() {
  if (!contentEl) return;

  // 清除可能影响正文样式的容器级设置
  contentEl.style.fontSize = '';
  contentEl.style.lineHeight = '';

  // 获取所有正文段落和文本元素
  const contentParagraphs = contentEl.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');

  // 应用设置到每个正文元素
  contentParagraphs.forEach(element => {
    // 跳过脚本自身的UI元素
    if (element.closest('div[style*="color:#666"], div[style*="color:#888"]')) return;

    // 强制应用字体大小和行高（使用!important）
    element.style.setProperty('font-size', `${state1.fontSize}px`, 'important');
    element.style.setProperty('line-height', `${state1.lineHeight}`, 'important');
  });

  // 同时设置容器的基础样式（作为后备）
  contentEl.style.fontSize = `${state1.fontSize}px`;
  contentEl.style.lineHeight = state1.lineHeight;
}





  const LS_KEY_PANEL = 'cr_reader_panel_state';
  const LS_KEY_PROGRESS = 'cr_reader_progress';

  function savePanelState() {
    const rect = panel.getBoundingClientRect();
    const data = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
    try { localStorage.setItem(LS_KEY_PANEL, JSON.stringify(data)); } catch {}
  }
  function restorePanelState() {
    try {
      const raw = localStorage.getItem(LS_KEY_PANEL);
      if (!raw) return;
      const { x, y, w, h } = JSON.parse(raw);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        panel.style.top = Math.max(2, Math.min(y, window.innerHeight - 50)) + 'px';
        panel.style.left = Math.max(2, Math.min(x, window.innerWidth - 50)) + 'px';
        panel.style.bottom = ''; panel.style.right = '';
      }
      if (Number.isFinite(w) && Number.isFinite(h)) {
        const cw = Math.max(220, Math.min(w, window.innerWidth - 10));
        const ch = Math.max(160, Math.min(h, window.innerHeight - 10));
        panel.style.width = cw + 'px';
        panel.style.height = ch + 'px';
      }
    } catch {}
  }
  function clampIntoViewport() {
    const rect = panel.getBoundingClientRect();
    let x = rect.left, y = rect.top, w = rect.width, h = rect.height;
    const maxX = window.innerWidth - w - 2;
    const maxY = window.innerHeight - h - 2;
    x = Math.max(2, Math.min(x, Math.max(2, maxX)));
    y = Math.max(2, Math.min(y, Math.max(2, maxY)));
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
  }
  window.addEventListener('resize', () => { clampIntoViewport(); savePanelState(); });

  function saveProgress({ tocUrl, chapterUrl, seriesId }) {
    const bookBase = (state.profile?.deriveBookBase?.(tocUrl || chapterUrl)) || generic.deriveBookBase(tocUrl || chapterUrl) || '';
    const payload = {
      tocUrl: tocUrl || null, chapterUrl: chapterUrl || null, seriesId: seriesId || null,
      bookBase, updatedAt: Date.now()
    };
    try { localStorage.setItem(LS_KEY_PROGRESS, JSON.stringify(payload)); } catch {}
  }
  function getSavedProgress() {
    try {
      const raw = localStorage.getItem(LS_KEY_PROGRESS);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || (!o.tocUrl && !o.chapterUrl)) return null;
      return o;
    } catch { return null; }
  }

  // ========== 抓取 ==========
  function decodeText(arrayBuffer, headersStr) {
    const lower = (headersStr || '').toLowerCase();
    const m = lower.match(/charset\s*=\s*([^\s;]+)/);
    const fromHeader = m && m[1] ? m[1].replace(/["']/g,'').toLowerCase() : '';
    const tryDec = enc => { try { return new TextDecoder(enc).decode(arrayBuffer); } catch { return null; } };
    let text = null;
    if (/big5/.test(fromHeader)) text = tryDec('big5') || tryDec('utf-8');
    else if (/gbk|gb18030|gb2312/.test(fromHeader)) text = tryDec('gbk') || tryDec('gb18030') || tryDec('utf-8');
    else text = tryDec('utf-8') || tryDec('gbk') || tryDec('gb18030') || tryDec('big5');
    if (!text) text = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
    const hint = (text.match(/<meta[^>]+charset\s*=\s*["']?\s*([a-z0-9-]+)/i) || [])[1];
    if (hint) {
      const h = hint.toLowerCase();
      if (/big5/.test(h)) text = tryDec('big5') || text;
      else if (/gb/.test(h)) text = tryDec('gbk') || tryDec('gb18030') || text;
    }
    return text;
  }

  function gmFetch(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType: 'arraybuffer',
        headers: { 'Accept': 'text/html,application/xhtml+xml' },
        timeout: 30000,
        onload: (res) => {
          try {
            const html = decodeText(res.response, res.responseHeaders || '');
            resolve({ html, finalUrl: url, headers: res.responseHeaders || '' });
          } catch (e) { reject(e); }
        },
        onerror: reject,
        ontimeout: () => reject(new Error('请求超时')),
      });
    });
  }

  const parseHTML = html => new DOMParser().parseFromString(html, 'text/html');

  // ========== 正文抽取（走 profile，可回落通用） ==========
  function extractMain(doc, baseUrl) {
    console.log('profile:', state.profile);
    if (state.profile?.extractContent) {
      try { return state.profile.extractContent(doc, baseUrl); } catch {}
    }
    return preferFirst(doc, [
      '#content', '#chaptercontent', '#chapterContent', '.content', '.read-content', '#contentTxt', '#BookText', '#txtContent'
    ], baseUrl);
  }

  // ========== 上下页 & 目录链接 ==========
  function getNavUrls(doc, baseUrl) {
    if (state.profile?.findNav) {
      try { return state.profile.findNav(doc, baseUrl); } catch {}
    }
    return generic.findNav(doc, baseUrl);
  }

  function getInfoUrl(doc, baseUrl, entryUrl) {
    if (state.profile?.findInfoUrl) {
      try { return state.profile.findInfoUrl(doc, baseUrl, entryUrl); } catch {}
    }
    return generic.findInfoUrl(doc, baseUrl, entryUrl);
  }

  // ========== 抓取章节（多页拼合） ==========
  async function fetchChapterSeries(entryUrl) {
    const visited = new Set();
    state.loading = true;
    state.pages = []; state.pageIndex = 0;
    state.seriesId = getSeriesIdFromUrl(entryUrl);
    state.nextChapterUrl = null; state.prevChapterUrl = null;
    state.profile = chooseProfile(entryUrl);

    const newBase = state.profile.deriveBookBase?.(entryUrl) || generic.deriveBookBase(entryUrl) || null;
    if (state.bookBase && newBase && state.bookBase !== newBase) {
      state.tocItems = []; // 切书：清空老目录缓存
    }
    state.bookBase = newBase;

    renderInfo('正在抓取章节…');

    try {
      const first = await gmFetch(entryUrl);
      const firstDoc = parseHTML(first.html);

      state.tocUrl = getInfoUrl(firstDoc, entryUrl, entryUrl);
      saveProgress({ tocUrl: state.tocUrl, chapterUrl: entryUrl, seriesId: state.seriesId });

      const { prev: prev0, next: next0 } = getNavUrls(firstDoc, entryUrl);
      state.prevChapterUrl = (prev0 && !isSameChapterPage(prev0, entryUrl)) ? prev0 : null;

      state.pages.push({ url: entryUrl, html: extractMain(firstDoc, entryUrl) });
      visited.add(new URL(entryUrl, location.href).href);

      // 连抓分页
      let cursor = next0, step = 0;
      while (cursor && isSameChapterPage(cursor, entryUrl) && step < 50) {
        const abs = new URL(cursor, entryUrl).href;
        if (visited.has(abs)) break;
        visited.add(abs);

        const pg = await gmFetch(abs);
        const d = parseHTML(pg.html);
        state.pages.push({ url: abs, html: extractMain(d, abs) });

        const nav = getNavUrls(d, abs);
        cursor = nav.next;
        step++;
        await sleep(60);
      }

      if (cursor && !isSameChapterPage(cursor, entryUrl)) state.nextChapterUrl = cursor;

      if (!state.pages.length) throw new Error('未抓到正文');
      showCurrentPage();

    } catch (err) {
      console.error('[clean-reader] 抓取失败：', err);
      renderInfo('抓取失败：' + (err && err.message ? err.message : '未知错误'));
    } finally {
      state.loading = false;
    }
  }

  // ========== 目录抓取与渲染 ==========
  async function openTOC() {
    state.modalOpen = true;

    // 切书校验：目录缓存属于别的书则清空
    const saved = getSavedProgress?.() || null;
    const desiredBase = (state.tocUrl ? (state.profile?.deriveBookBase?.(state.tocUrl) || generic.deriveBookBase(state.tocUrl))
                                      : (saved?.tocUrl ? (state.profile?.deriveBookBase?.(saved.tocUrl) || generic.deriveBookBase(saved.tocUrl))
                                                       : generic.deriveBookBase(location.href))) || null;
    const currBase = state.tocItems.length ? generic.deriveBookBase(state.tocItems[0].href) : null;
    if (currBase && desiredBase && currBase !== desiredBase) state.tocItems = [];

    toc.style.display = 'flex';
    $('#cr-toc-goto').value = '';

    if (!state.tocUrl) {
      const sp = getSavedProgress();
      if (sp && sp.tocUrl) state.tocUrl = sp.tocUrl;
      else state.tocUrl = state.bookBase || generic.deriveBookBase(location.href);
    }

    if (!state.tocItems.length) {
      tocListEl.innerHTML = `<div style="padding:8px;color:#666">正在加载目录…</div>`;
      try {
        const ok = await tryFetchTOC(state.tocUrl);
        if (!ok) throw new Error('未找到目录链接');
        state.tocPage = clampTocPageToCurrent(state.tocItems);
        renderTOC();
      } catch (e) {
        console.error('[clean-reader] 目录抓取失败：', e);
        tocListEl.innerHTML = `<div style="padding:8px;color:#c00">目录加载失败：${e && e.message ? e.message : '未知错误'}</div>`;
        tocRangeEl.textContent = '—';
      }
    } else {
      state.tocPage = clampTocPageToCurrent(state.tocItems);
      renderTOC();
    }
  }

  async function tryFetchTOC(tocUrl) {
    const base = (state.profile?.deriveBookBase?.(tocUrl) || generic.deriveBookBase(tocUrl) || tocUrl).replace(/\/?$/,'/');
    const candidates = (state.profile?.tocCandidates?.(base)) || [base, base + 'index.html'];

    for (const u of candidates) {
      try {
        const res = await gmFetch(u);
        const doc = parseHTML(res.html);
        const items = collectTOCItems(doc, u);
        if (items && items.length) {
          state.tocUrl = (state.profile?.deriveBookBase?.(u) || generic.deriveBookBase(u) || u);
          state.tocItems = items;
          return true;
        }
      } catch {}
    }
    return false;
  }

  function clampTocPageToCurrent(items) {
    const idx = items.findIndex(it => it.id && state.seriesId && it.id === state.seriesId);
    if (idx < 0) return state.tocPage || 0;
    return Math.floor(idx / state.tocPageSize);
  }

  function closeTOC() { state.modalOpen = false; toc.style.display = 'none'; }

  function collectTOCItems(doc, baseUrl) {
    const bookBase = (state.profile?.deriveBookBase?.(baseUrl) || generic.deriveBookBase(baseUrl) || '').replace(/\/?$/,'/');
    const isChapterLink = (abs) => (state.profile?.isChapterLink?.(abs, bookBase)) ?? (sameBook(abs, bookBase) && /\/\d+(?:_\d+)?\.html(?:[#?].*)?$/i.test(abs));

    // 1) 优先从 profile 指定容器搜
    const containersSel = state.profile?.tocContainers || [];
    const containerEls = containersSel.map(sel => doc.querySelector(sel)).filter(Boolean);

    let anchors = [];
    for (const c of containerEls) anchors.push(...c.querySelectorAll('a'));
    // 2) 容器里没拿到就全局兜底
    if (anchors.length === 0) anchors = Array.from(doc.querySelectorAll('a'));

    const out = [];
    const seen = new Set();

    for (const a of anchors) {
      const raw = safeHref(a.getAttribute('href') || '');
      if (!raw) continue;
      const abs = absolutize(baseUrl, raw);
      if (!isChapterLink(abs)) continue;
      if (seen.has(abs)) continue;
      seen.add(abs);
      const title = (a.textContent || a.getAttribute('title') || '').trim().replace(/\s+/g, ' ');
      const id = chapterIdFromHref(abs);
      out.push({ title: title || (id ? `章节 ${id}` : abs), href: abs, id });
    }

    // 3) 目录由脚本写入或结构非常规时，正则兜底（biquge.tw 常见）
    if (out.length < 5) {
      const html = doc.documentElement.innerHTML || '';
      const re = /<a[^>]+href=["']([^"']*\/book\/\d+\/\d+(?:_\d+)?\.html)["'][^>]*>([^<]*)<\/a>/ig;
      let m;
      while ((m = re.exec(html))) {
        const abs = absolutize(baseUrl, m[1]);
        if (!isChapterLink(abs) || seen.has(abs)) continue;
        seen.add(abs);
        const id = chapterIdFromHref(abs);
        const title = (m[2] || '').trim().replace(/\s+/g, ' ');
        out.push({ title: title || (id ? `章节 ${id}` : abs), href: abs, id });
      }
    }

    // 4) 过滤噪声项
    const blacklist = /(上一[页章]|下一[页章]|返回|顶|底|最新|目录)/;
    return out.filter(it => !blacklist.test(it.title));
  }

  // ========== 渲染 ==========
  function renderInfo(msg) { contentEl.innerHTML = `<div style="color:#666;font-size:12px">${msg}</div>`; }

// ========== 修改：显示当前页面函数 ==========
function showCurrentPage() {
  const idx = state.pageIndex;
  if (!state.pages[idx]) return;
  const total = state.pages.length;
  const currentUrl = state.pages[idx].url;

  // 渲染章节内容
  contentEl.innerHTML = `
    <div style="color:#666; font-size:12px; margin-bottom:8px;">第 ${idx+1}/${total} 页 · ←/→ 翻页，↑/↓ 滚动，Alt+1刷新</div>
    <div style="font-size:11px; color:#888; word-break:break-all; margin-top:4px;">
      当前网址: <a href="${currentUrl}" target="_blank" rel="noopener" style="color:#6699cc; text-decoration:none;">${currentUrl}</a>
    </div>
    <div id="cr-main-content">${state.pages[idx].html}</div> <!-- 添加特定ID以便选择 -->
  `;

  contentEl.scrollTop = 0;
  applyAllReplaceRules();

  // 确保设置应用 - 添加短暂延迟以确保DOM完全加载
  setTimeout(applySettings, 50);
}


  // ========== 面板显示/隐藏 ==========
  function showPanel(){ state.visible = true; panel.style.display = 'block'; restorePanelState(); clampIntoViewport(); }
  function hidePanel(){ state.visible = false; panel.style.display = 'none'; }
  function togglePanel(){ state.visible ? hidePanel() : showPanel(); }

  // ========== URL 弹窗 ==========
  function openUrlModal(defaultUrl) {
    state.modalOpen = true; showPanel(); modal.style.display = 'flex';
    const saved = getSavedProgress();
    urlInput.value = (saved && saved.chapterUrl) || defaultUrl || location.href;
    urlInput.focus(); urlInput.select();
  }
  function closeUrlModal() { state.modalOpen = false; modal.style.display = 'none'; }

  $('#cr-cancel', modal).addEventListener('click', closeUrlModal);
  $('#cr-confirm', modal).addEventListener('click', () => {
    const u = urlInput.value.trim();
    if (!u) return;
    closeUrlModal();
    fetchChapterSeries(u);
  });
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('#cr-confirm', modal).click(); }
    if (e.key === 'Escape') { e.preventDefault(); closeUrlModal(); }
  });

  // ========== 目录弹窗事件 ==========
  $('#cr-toc-close', toc).addEventListener('click', closeTOC);
  $('#cr-toc-prev', toc).addEventListener('click', () => { state.tocPage = Math.max(0, state.tocPage - 1); renderTOC(); });
  $('#cr-toc-next', toc).addEventListener('click', () => {
    const total = state.tocItems.length;
    const maxPage = Math.max(0, Math.ceil(total / state.tocPageSize) - 1);
    state.tocPage = Math.min(maxPage, state.tocPage + 1);
    renderTOC();
  });
  $('#cr-toc-go', toc).addEventListener('click', () => {
    const total = state.tocItems.length;
    const maxPage = Math.max(1, Math.ceil(total / state.tocPageSize));
    let p = parseInt(tocGotoEl.value, 10);
    if (!isFinite(p) || p < 1) p = 1;
    if (p > maxPage) p = maxPage;
    state.tocPage = p - 1;
    renderTOC();
  });
  tocGotoEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('#cr-toc-go', toc).click(); }
    if (e.key === 'Escape') { e.preventDefault(); closeTOC(); }
  });
  toc.addEventListener('keydown', (e) => {
    if (!state.modalOpen) return;
    if (e.key === 'PageDown') { e.preventDefault(); $('#cr-toc-next', toc).click(); }
    if (e.key === 'PageUp')   { e.preventDefault(); $('#cr-toc-prev', toc).click(); }
    if (e.key === 'Escape')   { e.preventDefault(); closeTOC(); }
  });

  function renderTOC() {
    const total = state.tocItems.length;
    const size = state.tocPageSize;
    const page = Math.max(0, Math.min(state.tocPage, Math.floor((total-1)/size) || 0));
    const start = page * size;
    const end = Math.min(start + size, total);
    const slice = state.tocItems.slice(start, end);

    tocListEl.innerHTML = slice.map((it, i) => {
      const idx = start + i + 1;
      const active = (it.id && state.seriesId && it.id === state.seriesId) ? ' active' : '';
      return `
        <div class="toc-item${active}" data-href="${it.href.replace(/"/g,'&quot;')}">
          <div class="toc-idx">${idx}.</div>
          <div class="toc-title">${escapeHTML(it.title)}</div>
        </div>
      `;
    }).join('') || `<div style="padding:8px;color:#666">目录为空</div>`;

    tocRangeEl.textContent = total ? `${start+1}-${end}` : '—';

    const maxPage = Math.max(1, Math.ceil(total / size));
    tocGotoEl.setAttribute('max', String(maxPage));
    tocGotoEl.setAttribute('placeholder', `1~${maxPage}`);

    tocListEl.querySelectorAll('.toc-item').forEach(el => {
      el.addEventListener('click', () => {
        const href = el.getAttribute('data-href');
        if (href) {
          closeTOC(); showPanel(); fetchChapterSeries(href);
        }
      });
      el.addEventListener('dblclick', () => {
        const href = el.getAttribute('data-href');
        if (href) {
          closeTOC(); showPanel(); fetchChapterSeries(href);
        }
      });
    });
  }

  function escapeHTML(s) {
    return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ========== 拖动/大小 ==========
  function startDrag(e){
    state.dragging = true;
    const rect = panel.getBoundingClientRect();
    state.dragDX = e.clientX - rect.left;
    state.dragDY = e.clientY - rect.top;
    panel.style.top = rect.top + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.bottom = ''; panel.style.right = '';
    document.addEventListener('mousemove', onDragMove, true);
    document.addEventListener('mouseup', endDrag, true);
    e.preventDefault(); e.stopPropagation();
  }
  function onDragMove(e){
    if (!state.dragging) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    let nx = e.clientX - state.dragDX;
    let ny = e.clientY - state.dragDY;
    const maxX = window.innerWidth - w - 2;
    const maxY = window.innerHeight - h - 2;
    nx = Math.max(2, Math.min(nx, maxX));
    ny = Math.max(2, Math.min(ny, maxY));
    panel.style.left = nx + 'px';
    panel.style.top  = ny + 'px';
  }
  function endDrag(){
    state.dragging = false;
    document.removeEventListener('mousemove', onDragMove, true);
    document.removeEventListener('mouseup', endDrag, true);
    savePanelState();
  }
  dragEl.addEventListener('mousedown', startDrag, true);

  function startResize(e){
    state.resizing = true;
    const rect = panel.getBoundingClientRect();
    state.startW = rect.width;
    state.startH = rect.height;
    state.startX = e.clientX;
    state.startY = e.clientY;
    panel.style.top = rect.top + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.bottom = ''; panel.style.right = '';
    document.addEventListener('mousemove', onResizeMove, true);
    document.addEventListener('mouseup', endResize, true);
    e.preventDefault(); e.stopPropagation();
  }
  function onResizeMove(e){
    if (!state.resizing) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    let w = state.startW + dx;
    let h = state.startH + dy;
    const minW = 220, minH = 160;
    const maxW = Math.min(window.innerWidth - 10, 900);
    const maxH = Math.min(window.innerHeight - 10, 900);
    w = Math.max(minW, Math.min(w, maxW));
    h = Math.max(minH, Math.min(h, maxH));
    panel.style.width  = w + 'px';
    panel.style.height = h + 'px';
    clampIntoViewport();
  }
  function endResize(){
    state.resizing = false;
    document.removeEventListener('mousemove', onResizeMove, true);
    document.removeEventListener('mouseup', endResize, true);
    savePanelState();
  }
  resizeEl.addEventListener('mousedown', startResize, true);

  // ========== 键盘捕获 ==========
  const SCROLL_STEP = 80;
  function handleKey(e) {
      //此处为AI增加

       // ========== 新增：Alt+A 打开设置面板 ==========
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
          e.preventDefault();
          e.stopPropagation();
          openSettingsModal();
          return;
      }

      // 新增：Alt+1 刷新当前章节
      if (e.altKey && e.key === '1') {
          e.preventDefault();
          e.stopPropagation();
          refreshCurrentChapter();
          return;
      }
       // 新增：Alt+Q 打开文本替换弹窗
      if (e.altKey && (e.key === 'q' || e.key === 'Q')) {
          e.preventDefault();
          e.stopPropagation();
          openReplaceModal();
          return;
      }
      //AI增加结束




    if (e.ctrlKey && e.altKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); e.stopPropagation(); openUrlModal(location.href); return; }
    if (e.altKey && (e.key === 't' || e.key === 'T')) { e.preventDefault(); e.stopPropagation(); openTOC(); return; }
    if (e.ctrlKey && e.altKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault(); e.stopPropagation();
      const saved = getSavedProgress();
      if (saved && saved.chapterUrl) { showPanel(); fetchChapterSeries(saved.chapterUrl); }
      else { openUrlModal(location.href); }
      return;
    }
    if (e.ctrlKey && e.altKey && (e.key === 'x' || e.key === 'X')) { e.preventDefault(); e.stopPropagation(); togglePanel(); return; }

    if (state.modalOpen) return;
    if (!state.visible) return;
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;

    e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();

    if (e.key === 'ArrowUp') {
      if (contentEl.scrollTop <= 0) {
        if (state.pageIndex > 0) { state.pageIndex--; showCurrentPage(); }
        else if (state.prevChapterUrl && !state.loading) { fetchChapterSeries(state.prevChapterUrl); }
        else contentEl.scrollTop = 0;
      } else {
        contentEl.scrollBy({ top: -SCROLL_STEP, behavior: 'smooth' });
      }
    }
    if (e.key === 'ArrowDown') {
      const atBottom = contentEl.scrollTop + contentEl.clientHeight >= contentEl.scrollHeight - 2;
      if (atBottom) {
        if (state.pageIndex < state.pages.length - 1) { state.pageIndex++; showCurrentPage(); }
        else if (state.nextChapterUrl && !state.loading) { fetchChapterSeries(state.nextChapterUrl); }
      } else {
        contentEl.scrollBy({ top: SCROLL_STEP, behavior: 'smooth' });
      }
    }
    if (e.key === 'ArrowLeft') {
      if (state.pageIndex > 0) { state.pageIndex--; showCurrentPage(); }
      else if (state.prevChapterUrl && !state.loading) { fetchChapterSeries(state.prevChapterUrl); }
    }
    if (e.key === 'ArrowRight') {
      if (state.pageIndex < state.pages.length - 1) { state.pageIndex++; showCurrentPage(); }
      else if (state.nextChapterUrl && !state.loading) { fetchChapterSeries(state.nextChapterUrl); }
    }
  }
  window.addEventListener('keydown', handleKey, true);

  // ========== 辅助 ==========

    // 新增：应用所有替换规则到当前内容（核心函数）
    function applyAllReplaceRules() {
        const contentEl = $('#cr-content', panel);
        if (!contentEl || state1.replaceRules.length === 0) return;

        let currentHtml = contentEl.innerHTML;
        let totalReplaceCount = 0;

        // 遍历所有规则，逐个替换
        state1.replaceRules.forEach(rule => {
            const from = rule.from.trim();
            if (!from) return;

            // 计算当前规则替换次数
            const count = (currentHtml.split(from).length - 1);
            totalReplaceCount += count;

            // 执行替换（全局替换所有匹配）
            currentHtml = currentHtml.replaceAll(from, rule.to);
        });

        // 更新内容（只有有替换时才更新，避免无意义DOM操作）
        if (totalReplaceCount > 0) {
            contentEl.innerHTML = currentHtml;
        }
    }

    // ========== 文本替换功能（新增） ==========
// 打开替换弹窗
function openReplaceModal() {
  state1.modalOpen = true;
  showPanel(); // 显示小窗
  replaceModal.style.display = 'flex';
  replaceFrom.focus(); // 自动聚焦到原文本输入框
}

// 关闭替换弹窗
function closeReplaceModal() {
  state1.modalOpen = false;
  replaceModal.style.display = 'none';
  replaceFrom.value = ''; // 清空输入
  replaceTo.value = '';
}

// 执行文本替换
// 改造：添加替换规则（替换之前的 replaceText 函数）
function addReplaceRule() {
  const fromText = replaceFrom.value.trim();
  const toText = replaceTo.value;

  // 校验：原文本不能为空
  if (!fromText) {
    alert('请输入要替换的原文本！');
    return;
  }

  // 校验：避免重复添加相同原文本的规则（可选，可根据需求删除）
  const isDuplicate = state1.replaceRules.some(rule =>
    rule.from.trim() === fromText
  );
  if (isDuplicate) {
    if (!confirm(`已存在「${fromText}」的替换规则，是否覆盖？`)) {
      return;
    }
    // 覆盖旧规则
    state1.replaceRules = state1.replaceRules.filter(rule =>
      rule.from.trim() !== fromText
    );
  }

  // 添加/更新规则
  state1.replaceRules.push({ from: fromText, to: toText });
  saveReplaceRules(); // 保存到本地
  renderReplaceRulesList(); // 刷新弹窗规则列表
  applyAllReplaceRules(); // 立即对当前章生效

  // 清空输入框，提示成功
  replaceFrom.value = '';
  replaceTo.value = '';
  alert(`添加成功！当前共 ${state1.replaceRules.length} 组规则（所有章节自动生效）`);
}





  //function renderInfo(msg) { contentEl.innerHTML = `<div style="color:#666;font-size:12px">${msg}</div>`; }

  restorePanelState();

    // 初始化黑暗模式功能，AI增加
  // 初始化功能
    setTimeout(() => {
        addDarkModeFeature();

    }, 500);
    // AI新增：初始化加载替换规则（脚本启动时加载，立即对当前章生效）
    setTimeout(() => {
        loadReplaceRules();
        applyAllReplaceRules();
    }, 600);

    // ========== 新增：初始化加载阅读设置 ==========
  setTimeout(() => {
      loadSettings(); // 脚本启动时加载保存的字号/行高
  }, 700);
})();
