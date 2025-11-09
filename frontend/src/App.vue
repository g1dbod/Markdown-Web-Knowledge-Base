<template>
  <router-view />
</template>

<script setup>
// Корневой компонент теперь просто рендерит router-view
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--color-contentBg);
  color: var(--color-contentText);
}

/* Кастомный скроллбар */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: var(--color-scrollbarTrack);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: var(--color-scrollbarThumb);
  border-radius: 10px;
  border: 2px solid var(--color-scrollbarTrack);
  transition: background 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-scrollbarThumbHover);
}

/* Для Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbarThumb) var(--color-scrollbarTrack);
}

/* Тонкий скроллбар для боковой панели */
.sidebar::-webkit-scrollbar {
  width: 8px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: var(--color-scrollbarThumbSidebar);
  border-radius: 10px;
  border: 2px solid var(--color-scrollbarTrack);
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--color-scrollbarThumbSidebarHover);
}

/* Глобальные стили для markdown контента */
.markdown-body {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px;
  color: var(--color-contentText);
}

.markdown-body h1 {
  font-size: 2em;
  margin-bottom: 20px;
  color: var(--color-heading1);
  border-bottom: 2px solid var(--color-borderColor);
  padding-bottom: 10px;
}

.markdown-body h2 {
  font-size: 1.5em;
  margin-top: 30px;
  margin-bottom: 15px;
  color: var(--color-heading2);
}

.markdown-body h3 {
  font-size: 1.2em;
  margin-top: 20px;
  margin-bottom: 10px;
  color: var(--color-heading3);
}

.markdown-body p {
  line-height: 1.6;
  margin-bottom: 15px;
}

.markdown-body code {
  background: var(--color-codeBg);
  color: var(--color-codeText);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown-body pre {
  background: var(--color-codeBlockBg);
  color: var(--color-codeBlockText);
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  margin-bottom: 15px;
}

.markdown-body pre code {
  background: transparent;
  color: inherit;
  padding: 0;
}

.markdown-body ul, .markdown-body ol {
  margin-left: 20px;
  margin-bottom: 15px;
}

.markdown-body li {
  margin-bottom: 5px;
}

.markdown-body a {
  color: var(--color-linkColor);
  text-decoration: none;
  cursor: pointer;
}

.markdown-body a:hover {
  color: var(--color-linkHover);
  text-decoration: underline;
}

.markdown-body blockquote {
  border-left: 4px solid var(--color-quoteBorder);
  padding-left: 15px;
  margin: 15px 0;
  color: var(--color-quoteText);
  font-style: italic;
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 15px;
}

.markdown-body th, .markdown-body td {
  border: 1px solid var(--color-tableBorder);
  padding: 10px;
  text-align: left;
}

.markdown-body th {
  background: var(--color-tableHeaderBg);
  color: var(--color-tableHeaderText);
}

.error-message {
  padding: 40px;
  text-align: center;
  color: var(--color-errorColor);
}

.error-message h2 {
  margin-bottom: 20px;
}

.error-message code {
  background: var(--color-codeBg);
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 0.9em;
}
</style>
