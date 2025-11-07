// ==UserScript==
// @name         智能切换所有链接（双重保险版）
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  按下 Ctrl+Alt+P 切换所有链接打开方式，支持复杂网站，一进入网页立即处理a标签
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    let openInNewWindow = false;
    const siteRules = {};
    let ruleCount = 0;

    // 创建优雅的提示框
    function createNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 15px';
        notification.style.backgroundColor = '#333';
        notification.style.color = '#fff';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.zIndex = '999999';
        notification.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    // 切换状态
    function toggleState() {
        openInNewWindow = !openInNewWindow;
        updateLinks(); // 切换时也更新所有a标签
        createNotification(
            '当前状态：' + (openInNewWindow ? '新开窗口 ✅' : '此页面打开 🔄') +
            '\n已学习规则：' + ruleCount + ' 条'
        );
    }

    // 生成元素唯一标识
    function getElementSignature(el) {
        let sig = [];
        sig.push(el.tagName.toLowerCase());
        if (el.id) sig.push(`#${el.id}`);
        if (el.className) sig.push(`.${el.className.trim().replace(/\s+/g, '.')}`);
        ['data-url', 'data-href', 'href', 'link', 'onclick'].forEach(attr => {
            if (el.hasAttribute(attr)) sig.push(`[${attr}]`);
        });
        return sig.join('');
    }

    // 学习规则
    function learnRule(el, url) {
        const sig = getElementSignature(el);
        if (sig && url && !siteRules[sig]) {
            siteRules[sig] = url;
            ruleCount++;
            console.log('学习到新规则:', sig, '→', url, '（总计：', ruleCount, '条）');
            createNotification('已学习新规则！总数：' + ruleCount + ' 条');
        }
    }

    // 更新所有a标签的target属性
    function updateLinks() {
        document.querySelectorAll('a').forEach(link => {
            if (openInNewWindow) {
                link.target = '_blank';
            } else {
                link.removeAttribute('target');
            }
        });
    }

    // 页面加载时立即处理所有a标签
    function init() {
        updateLinks();
        
        // 监听动态添加的a标签
        const observer = new MutationObserver(() => {
            updateLinks();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 底层拦截所有点击
    document.addEventListener('click', function(e) {
        let target = e.target;

        // 处理普通 a 标签
        const link = target.closest('a');
        if (link && link.href) {
            if (openInNewWindow) {
                e.preventDefault();
                e.stopPropagation();
                window.open(link.href, '_blank');
            }
            return;
        }

        // 检查是否已学习过规则
        const sig = getElementSignature(target);
        if (siteRules[sig]) {
            if (openInNewWindow) {
                e.preventDefault();
                e.stopPropagation();
                window.open(siteRules[sig], '_blank');
            }
            return;
        }

        // 学习模式
        if (!openInNewWindow) {
            const originalOpen = window.open;
            window.open = function(url) {
                learnRule(target, url);
                return originalOpen.apply(window, arguments);
            };

            const originalLocation = window.location;
            const locationProxy = new Proxy(window.location, {
                set: function(obj, prop, value) {
                    if (prop === 'href') {
                        learnRule(target, value);
                    }
                    return Reflect.set(obj, prop, value);
                }
            });
            window.location = locationProxy;

            setTimeout(() => {
                window.open = originalOpen;
                window.location = originalLocation;
            }, 1000);
        }
    }, true);

    // 监听键盘事件
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            toggleState();
        }
    });

    // 初始化
    window.addEventListener('load', () => {
        init();
        createNotification('智能脚本已启动！按 Ctrl+Alt+P 切换模式');
    });

    // DOMContentLoaded时也执行一次，确保尽早处理
    document.addEventListener('DOMContentLoaded', init);
})();