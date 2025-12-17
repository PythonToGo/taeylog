// Simple Markdown Editor (inspired by velog editor)
(function () {
  'use strict';

  let editor;
  let preview;
  let statsElement;
  let autoSaveTimer;
  let isAutoSaving = false;
  let lastSavedContent = '';
  let currentPostPath = '';
  let selectedCategory = null;
  let selectedSubcategory = null;
  let categoriesData = [];
  const AUTO_SAVE_INTERVAL = 3000;
  const DRAFT_STORAGE_KEY = 'markdown-editor-draft';
  const DRAFT_PATH_KEY = 'markdown-editor-draft-path';
  
  // Detect if we're in development or production
  const IS_DEVELOPMENT = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === '';
  
  // API base URL - use localhost:3001 for API server in development only
  // In production (GitHub Pages), we use GitHub API directly
  const API_BASE_URL = IS_DEVELOPMENT ? 'http://localhost:3001' : null;
  
  function getApiUrl(endpoint) {
    // In production, don't use local API (it won't work on GitHub Pages)
    if (!IS_DEVELOPMENT) {
      return null; // Signal to use GitHub API instead
    }
    return API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
  }
  
  function isLocalApiAvailable() {
    return IS_DEVELOPMENT && API_BASE_URL !== null;
  }

  function initEditor() {
    editor = document.getElementById('markdown-editor-input');
    preview = document.getElementById('markdown-preview-output');
    statsElement = document.getElementById('editor-stats');

    if (!editor || !preview) {
      return;
    }

    // Load draft from localStorage (velog style)
    loadDraft();
    
    // If editor is empty, show default template
    if (editor && (!editor.value || editor.value.trim() === '')) {
      setDefaultTemplate();
    }

    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      });
      
      // Configure marked to preserve math expressions and add syntax highlighting
      const renderer = new marked.Renderer();
      const originalParagraph = renderer.paragraph;
      const originalCode = renderer.code;
      const originalText = renderer.text;
      
      // Preserve inline math in text
      renderer.text = function(text) {
        // Don't escape math expressions - they will be handled separately
        return originalText.call(this, text);
      };
      
      // Preserve math blocks in paragraphs
      renderer.paragraph = function(text) {
        // Don't wrap math blocks in <p> tags
        const trimmed = text.trim();
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
          return trimmed + '\n';
        }
        return originalParagraph.call(this, text);
      };
      
      // Add syntax highlighting to code blocks
      renderer.code = function(code, language) {
        // Default to python if no language specified
        const lang = language || 'python';
        
        // Map language aliases
        const langMap = {
          'py': 'python',
          'js': 'javascript',
          'cpp': 'cpp',
          'c++': 'cpp',
          'c': 'c',
          'bash': 'bash',
          'sh': 'bash',
          'shell': 'bash',
          'zsh': 'bash',
          'cmd': 'bash',
          'powershell': 'bash',
          'terminal': 'bash',
          'console': 'bash'
        };
        const mappedLang = langMap[lang.toLowerCase()] || lang.toLowerCase();
        
        // Check if highlight.js is available
        if (typeof hljs !== 'undefined') {
          try {
            // Check if language is supported
            if (hljs.getLanguage(mappedLang)) {
              const highlighted = hljs.highlight(code, { language: mappedLang });
              // Add terminal class for bash/shell languages
              const isTerminal = ['bash', 'shell', 'sh'].includes(mappedLang);
              const preClass = isTerminal ? 'terminal-block' : '';
              return `<pre class="${preClass}"><code class="hljs language-${mappedLang}">${highlighted.value}</code></pre>`;
            }
          } catch (e) {
            console.warn('Highlight.js error:', e);
          }
        }
        
        // Fallback to original code rendering
        return originalCode.call(this, code, lang);
      };
      
      marked.setOptions({ renderer: renderer });
    }

    editor.addEventListener('input', function () {
      updatePreview();
      updateStats();
      scheduleAutoSave();
    });

    // Auto-save on page unload (localStorage only for quick save)
    window.addEventListener('beforeunload', function (e) {
      if (editor.value && editor.value !== lastSavedContent) {
        // Quick save to localStorage only
        try {
          const content = editor.value;
          const path = document.getElementById('post-path')?.value || '';
          localStorage.setItem(DRAFT_STORAGE_KEY, content);
          if (path) {
            localStorage.setItem(DRAFT_PATH_KEY, path);
          }
        } catch (err) {
          console.warn('Failed to save draft on unload:', err);
        }
        // Show warning if there's unsaved content
        e.preventDefault();
        e.returnValue = '';
      }
    });

    editor.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart || 0;
        const end = editor.selectionEnd || 0;
        const value = editor.value || '';
        editor.value =
          value.substring(0, start) + '  ' + value.substring(end);
        const pos = start + 2;
        if (typeof editor.setSelectionRange === 'function') {
          editor.setSelectionRange(pos, pos);
        }
        updatePreview();
        updateStats();
      }
    });

    updatePreview();
    updateStats();

    // Load categories
    loadCategories();

    // Expose toolbar helpers
    window.insertMarkdown = insertMarkdown;
    window.toggleFullscreen = toggleFullscreen;
    window.newPost = newPost;
    window.loadPost = loadPost;
    window.savePost = savePost;
    window.setupGitHubToken = setupGitHubToken;
    window.toggleCategorySelector = toggleCategorySelector;
    window.selectCategory = selectCategory;
    window.selectSubcategory = selectSubcategory;
    window.filterCategories = filterCategories;
    window.addNewCategory = addNewCategory;
    window.updatePostPath = updatePostPath;

    // Close category selector when clicking outside
    document.addEventListener('click', function(e) {
      const selector = document.getElementById('category-selector');
      const btn = document.getElementById('category-selector-btn');
      if (selector && btn && !selector.contains(e.target) && !btn.contains(e.target)) {
        selector.style.display = 'none';
      }
    });
  }

  // Auto-save to API (local API or GitHub API)
  function scheduleAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    autoSaveTimer = setTimeout(function () {
      performAutoSave();
    }, AUTO_SAVE_INTERVAL);
  }

  async function performAutoSave() {
    if (!editor || isAutoSaving) return;
    
    const content = editor.value;
    
    // Skip auto-save if no category is selected or content hasn't changed
    if (!selectedCategory || content === lastSavedContent) {
      // Still save to localStorage as backup
      saveDraftToLocalStorage();
      return;
    }
    
    // Generate path if needed
    const pathInput = document.getElementById('post-path');
    let path = pathInput?.value?.trim();
    if (!path) {
      updatePostPath();
      path = pathInput?.value?.trim();
    }
    
    if (!path) {
      // No path generated, skip auto-save
      saveDraftToLocalStorage();
      return;
    }
    
    // Skip if content is empty
    if (!content || !content.trim()) {
      return;
    }
    
    isAutoSaving = true;
    
    try {
      // Check if GitHub token is available
      const githubToken = localStorage.getItem('github-token');
      
      if (githubToken) {
        // Use GitHub API for auto-save
        await autoSaveToGitHub(path, content);
      } else if (isLocalApiAvailable()) {
        // Use local API for auto-save (development only)
        await autoSaveToLocalAPI(path, content);
      } else {
        // No API available, just save to localStorage
        saveDraftToLocalStorage();
        updateSaveStatus('draft', 'Saved to local storage (GitHub token required for auto-save)');
      }
    } catch (error) {
      console.warn('Auto-save failed:', error);
      // Fallback to localStorage
      saveDraftToLocalStorage();
    } finally {
      isAutoSaving = false;
    }
  }

  function saveDraftToLocalStorage() {
    if (!editor) return;
    try {
      const content = editor.value;
      const path = document.getElementById('post-path')?.value || '';
      localStorage.setItem(DRAFT_STORAGE_KEY, content);
      if (path) {
        localStorage.setItem(DRAFT_PATH_KEY, path);
      }
    } catch (e) {
      console.warn('Failed to save draft to localStorage:', e);
    }
  }

  async function autoSaveToLocalAPI(path, content) {
    if (!isLocalApiAvailable()) {
      throw new Error('Local API not available');
    }
    try {
      const response = await fetch(getApiUrl('/api/save'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path,
          content: content
        })
      });
      
      if (response.ok) {
        lastSavedContent = content;
        currentPostPath = path;
        updateSaveStatus('draft', 'Auto-saved');
        saveDraftToLocalStorage(); // Also save to localStorage as backup
      } else {
        throw new Error('API save failed');
      }
    } catch (error) {
      // Silently fail for auto-save, just log it
      console.warn('Auto-save to local API failed:', error);
      saveDraftToLocalStorage();
    }
  }

  async function autoSaveToGitHub(path, content) {
    const githubToken = localStorage.getItem('github-token');
    if (!githubToken) return;

    const repoOwner = localStorage.getItem('github-owner');
    const repoName = localStorage.getItem('github-repo');
    
    if (!repoOwner || !repoName) {
      // Fallback to local API if GitHub repo info is not set
      await autoSaveToLocalAPI(path, content);
      return;
    }

    try {
      // Get current file SHA if exists (for update)
      let sha = null;
      try {
        const getResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        if (getResponse.ok) {
          const fileData = await getResponse.json();
          sha = fileData.sha;
        }
      } catch (e) {
        // File doesn't exist, will create new
      }

      // Save to GitHub
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: sha ? `Auto-save: Update ${path}` : `Auto-save: Create ${path}`,
            content: btoa(unescape(encodeURIComponent(content))),
            sha: sha
          })
        }
      );

      if (response.ok) {
        lastSavedContent = content;
        currentPostPath = path;
        updateSaveStatus('draft', 'Auto-saved to GitHub');
        saveDraftToLocalStorage(); // Also save to localStorage as backup
      } else {
        throw new Error('GitHub save failed');
      }
    } catch (error) {
      // Silently fail for auto-save, just log it
      console.warn('Auto-save to GitHub failed:', error);
      // Fallback to local API
      await autoSaveToLocalAPI(path, content);
    }
  }

  function loadDraft() {
    if (!editor) return;
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      const draftPath = localStorage.getItem(DRAFT_PATH_KEY);
      if (draft) {
        editor.value = draft;
        lastSavedContent = draft;
        if (draftPath) {
          const pathInput = document.getElementById('post-path');
          if (pathInput) pathInput.value = draftPath;
          currentPostPath = draftPath;
        }
        updatePreview();
        updateStats();
        updateSaveStatus('draft', 'Draft loaded');
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(DRAFT_PATH_KEY);
    } catch (e) {
      console.warn('Failed to clear draft:', e);
    }
  }

  function updateSaveStatus(type, message) {
    const statusElement = document.getElementById('github-status');
    if (!statusElement) return;
    
    const icons = {
      'saving': '<i class="fas fa-spinner fa-spin"></i>',
      'success': '<i class="fas fa-check-circle text-success"></i>',
      'error': '<i class="fas fa-exclamation-circle text-danger"></i>',
      'draft': '<i class="fas fa-save text-info"></i>'
    };
    
    statusElement.innerHTML = `${icons[type] || ''} <span class="ms-1">${message}</span>`;
    
    // Clear status after 3 seconds for success/draft
    if (type === 'success' || type === 'draft') {
      setTimeout(function () {
        if (statusElement.innerHTML.includes(message)) {
          statusElement.innerHTML = '';
        }
      }, 3000);
    }
  }

  function updatePreview() {
    if (!preview) return;

    const sourceEl = document.getElementById('markdown-editor-input');
    if (!sourceEl) return;

    const rawText =
      typeof sourceEl.value === 'string'
        ? sourceEl.value
        : (sourceEl.textContent || '');

    const markdown = rawText;

    // Use marked.js to parse markdown if available
    let html = '';
    if (typeof marked !== 'undefined') {
      try {
        // Protect math expressions before parsing
        const mathPlaceholders = [];
        let placeholderIndex = 0;
        
        // Use HTML comments as placeholders (they won't be escaped)
        const generatePlaceholder = (type, index) => {
          return `<!--MATH_${type}_${index}-->`;
        };
        
        // Protect block math ($$...$$) - must match across newlines
        let protectedMarkdown = markdown.replace(/\$\$[\s\S]*?\$\$/g, function(match) {
          const placeholder = generatePlaceholder('BLOCK', placeholderIndex);
          mathPlaceholders.push({ placeholder: placeholder, expression: match });
          placeholderIndex++;
          return placeholder;
        });
        
        // Protect inline math ($...$) - but not $$...$$
        protectedMarkdown = protectedMarkdown.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, function(match) {
          const placeholder = generatePlaceholder('INLINE', placeholderIndex);
          mathPlaceholders.push({ placeholder: placeholder, expression: match });
          placeholderIndex++;
          return placeholder;
        });
        
        // Parse markdown
        html = marked.parse(protectedMarkdown);
        
        // Restore math expressions from HTML comments
        for (let i = 0; i < mathPlaceholders.length; i++) {
          const math = mathPlaceholders[i];
          html = html.replace(math.placeholder, math.expression);
        }
      } catch (e) {
        console.error('Markdown parsing error:', e);
        // Fallback to simple HTML conversion
        html = markdown
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }
    } else {
      // Fallback if marked.js is not loaded
      html = markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }

    preview.innerHTML = html;

    // Apply syntax highlighting to code blocks
    if (typeof hljs !== 'undefined') {
      preview.querySelectorAll('pre code').forEach(function(block) {
        // Only highlight if not already highlighted
        if (!block.classList.contains('hljs')) {
          hljs.highlightElement(block);
        }
      });
    }

    // MathJax rendering if available
    if (window.MathJax && window.MathJax.typesetPromise) {
      setTimeout(function() {
        // Clear previous MathJax rendering
        if (window.MathJax.startup && window.MathJax.startup.document) {
          window.MathJax.startup.document.state(0);
        }
        window.MathJax.typesetPromise([preview]).catch(function (err) {
          console.error('MathJax rendering error:', err);
        });
      }, 100);
    }
  }

  function updateStats() {
    if (!statsElement) return;

    const sourceEl = document.getElementById('markdown-editor-input');
    if (!sourceEl) return;

    const text =
      typeof sourceEl.value === 'string'
        ? sourceEl.value
        : (sourceEl.textContent || '');
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    statsElement.textContent = `${words} words, ${characters} characters`;
  }

  function insertMarkdown(before, after = '') {
    const el = document.getElementById('markdown-editor-input');
    if (!el) return;

    const current =
      typeof el.value === 'string'
        ? el.value
        : (el.textContent || '');
    const value = String(current);
    const start =
      typeof el.selectionStart === 'number' && el.selectionStart >= 0
        ? el.selectionStart
        : value.length;
    const end =
      typeof el.selectionEnd === 'number' && el.selectionEnd >= 0
        ? el.selectionEnd
        : value.length;

    const s = Math.min(start, end);
    const e = Math.max(start, end);

    const selected = value.substring(s, e);
    const newValue =
      value.substring(0, s) + before + selected + after + value.substring(e);
    if (typeof el.value === 'string' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = newValue;
    } else {
      el.textContent = newValue;
    }

    const pos = s + before.length + selected.length + after.length;
    if (typeof el.setSelectionRange === 'function') {
      el.setSelectionRange(pos, pos);
    }
    el.focus();

    if (el === editor) {
      updatePreview();
      updateStats();
    }
  }

  function toggleFullscreen(panel) {
    const editorPanel = document.querySelector('.editor-panel');
    const previewPanel = document.querySelector('.preview-panel');
    if (!editorPanel || !previewPanel) return;

    if (panel === 'editor') {
      editorPanel.classList.toggle('fullscreen');
      previewPanel.style.display = editorPanel.classList.contains('fullscreen')
        ? 'none'
        : '';
    } else if (panel === 'preview') {
      previewPanel.classList.toggle('fullscreen');
      editorPanel.style.display = previewPanel.classList.contains('fullscreen')
        ? 'none'
        : '';
    }
  }

  function setDefaultTemplate() {
    if (!editor) return;
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    const dateTimeStr = `${dateStr} ${timeStr}:00`;
    
    // Get selected category for default categories
    const defaultCategory = selectedCategory ? `[${selectedCategory}]` : '[]';
    
    editor.value =
      `---\n` +
      `title: \n` +
      `date: ${dateTimeStr}\n` +
      `categories: ${defaultCategory}\n` +
      `tags: []\n` +
      `pin: false\n` +
      `math: false\n` +
      `mermaid: false\n` +
      `comments: true\n` +
      `image: \n` +
      `    path: \n` +
      `    lqip: \n` +
      `    alt: \n` +
      `---\n\n`;
    
    lastSavedContent = editor.value;
    updatePreview();
    updateStats();
  }

  function newPost() {
    if (!editor) return;
    if (editor.value && editor.value.trim() && editor.value !== lastSavedContent) {
    if (
      !confirm(
          'Do you want to start a new post? The current content will be saved automatically.'
      )
    ) {
      return;
    }
      saveDraft();
    }
    
    setDefaultTemplate();
    
    const pathInput = document.getElementById('post-path');
    const titleInput = document.getElementById('post-title');
    if (pathInput) pathInput.value = '';
    if (titleInput) titleInput.value = '';
    currentPostPath = '';
    selectedCategory = null;
    selectedSubcategory = null;
    updateCategoryDisplay();
    clearDraft();
    saveDraftToLocalStorage(); // Save empty template to localStorage
    updateSaveStatus('success', 'New post started');
    editor.focus();
  }

  async function loadPost() {
    const pathInput = document.getElementById('post-path');
    const path = pathInput?.value?.trim();
    
    if (!path) {
      // Show post list modal or prompt
      try {
        const response = await fetch(getApiUrl('/api/posts'));
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
          const postList = data.posts.map((p, i) => `${i + 1}. ${p.name} (${p.path})`).join('\n');
          const selected = prompt(`Select a post:\n\n${postList}\n\nEnter the number or path:`);
          
          if (selected) {
            const index = parseInt(selected) - 1;
            if (index >= 0 && index < data.posts.length) {
              await loadPostFromPath(data.posts[index].path);
            } else if (selected.includes('/')) {
              await loadPostFromPath(selected);
            }
          }
        } else {
          alert('No posts to load.');
        }
      } catch (error) {
        console.error('Load posts error:', error);
        const manualPath = prompt('Enter the post path (e.g. _posts/2025-12-01-example.md):');
        if (manualPath) {
          await loadPostFromPath(manualPath);
        }
      }
    } else {
      await loadPostFromPath(path);
    }
  }

  async function loadPostFromPath(path) {
    if (!path) return;
    
    updateSaveStatus('saving', 'Loading...');
    
    try {
      // Try local API first (development)
      if (isLocalApiAvailable()) {
        try {
          const response = await fetch(getApiUrl(`/api/load?path=${encodeURIComponent(path)}`));
          if (response.ok) {
            const data = await response.json();
            await processLoadedPost(data, path);
            return;
          }
        } catch (error) {
          console.warn('Local API failed, trying GitHub API...', error);
        }
      }
      
      // Use GitHub API (production or fallback)
      const githubToken = localStorage.getItem('github-token');
      const repoOwner = localStorage.getItem('github-owner');
      const repoName = localStorage.getItem('github-repo');
      
      if (githubToken && repoOwner && repoName) {
        await loadPostFromGitHub(path, repoOwner, repoName, githubToken);
      } else {
        throw new Error('GitHub token not set. Please set up GitHub token first.');
      }
    } catch (error) {
      console.error('Load post error:', error);
      updateSaveStatus('error', `Failed to load post: ${error.message}`);
      alert(`Failed to load post: ${error.message}`);
    }
  }

  async function loadPostFromGitHub(path, repoOwner, repoName, githubToken) {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to load post from GitHub');
    }
    
    const fileData = await response.json();
    // Decode base64 content
    const content = decodeURIComponent(escape(atob(fileData.content)));
    
    // Extract title from front matter
    let title = '';
    if (content.startsWith('---')) {
      const frontMatterEnd = content.indexOf('---', 3);
      if (frontMatterEnd > 0) {
        const frontMatter = content.substring(3, frontMatterEnd);
        const titleMatch = frontMatter.match(/title:\s*(.+)/);
        if (titleMatch) {
          title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    }
    
    await processLoadedPost({ content, title }, path);
  }

  async function processLoadedPost(data, path) {
    if (editor) {
      editor.value = data.content || '';
      lastSavedContent = editor.value;
      currentPostPath = path;
      
      // Parse path to extract category and subcategory
      // Format: _posts/category/subcategory/date-title.md
      const pathMatch = path.match(/^_posts\/([^\/]+)(?:\/([^\/]+))?\/([^\/]+)\.md$/);
      if (pathMatch) {
        selectedCategory = pathMatch[1];
        selectedSubcategory = pathMatch[2] || null;
        updateCategoryDisplay();
      }
      
      const pathInput = document.getElementById('post-path');
      const titleInput = document.getElementById('post-title');
      if (pathInput) pathInput.value = path;
      if (titleInput && data.title) titleInput.value = data.title;
      
    updatePreview();
    updateStats();
      updateSaveStatus('success', 'Post loaded successfully');
      clearDraft();
      
      // Refresh category tree to show selection
      renderCategoryTree();
    }
  }

  async function savePost() {
    if (!selectedCategory) {
      alert('Please select a category first.');
      toggleCategorySelector();
      return;
    }
    
    const pathInput = document.getElementById('post-path');
    let path = pathInput?.value?.trim();
    
    // Generate path if not set
    if (!path) {
      updatePostPath();
      path = pathInput?.value?.trim();
  }

    if (!path) {
      alert('Please select a category and enter a post title.');
      return;
    }
    
    if (!editor || !editor.value) {
      alert('There is no content to save.');
      return;
    }

    // Check if GitHub token is set
    const githubToken = localStorage.getItem('github-token');
    
    // In production, only GitHub API is available
    if (!IS_DEVELOPMENT) {
      if (!githubToken) {
        alert('GitHub token is required in production. Please set up GitHub token first.');
        setupGitHubToken();
        return;
      }
      await saveToGitHub(path, editor.value);
      return;
    }
    
    // In development, choose between GitHub and local API
    const useGitHub = githubToken && confirm('Do you want to save to GitHub? (Cancel to use local API)');
    
    if (useGitHub) {
      await saveToGitHub(path, editor.value);
    } else {
      await saveToLocalAPI(path, editor.value);
    }
  }

  async function saveToLocalAPI(path, content) {
    if (!isLocalApiAvailable()) {
      throw new Error('Local API not available. Please use GitHub API in production.');
    }
    
    updateSaveStatus('saving', 'Saving...');
    
    try {
      const response = await fetch(getApiUrl('/api/save'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path,
          content: content
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }
      
      const data = await response.json();
      lastSavedContent = content;
      currentPostPath = path;
      clearDraft();
      updateSaveStatus('success', 'Saved successfully');
      
      // Update path input if it was empty
      const pathInput = document.getElementById('post-path');
      if (pathInput && !pathInput.value) {
        pathInput.value = path;
      }
    } catch (error) {
      console.error('Save error:', error);
      updateSaveStatus('error', `Failed to save: ${error.message}`);
      alert(`Failed to save: ${error.message}\n\nCheck if the local API server is running (npm start in api/)`);
    }
  }

  async function saveToGitHub(path, content) {
    const githubToken = localStorage.getItem('github-token');
    if (!githubToken) {
      alert('GitHub token is not set.');
      setupGitHubToken();
      return;
    }

    // Get repo info from current page or prompt
    const repoMatch = window.location.hostname.match(/github\.io/);
    let repoOwner = localStorage.getItem('github-owner');
    let repoName = localStorage.getItem('github-repo');
    
    if (!repoOwner || !repoName) {
      const repoInfo = prompt('Enter the GitHub repository information:\nFormat: owner/repo\nExample: username/taeylog');
      if (!repoInfo) return;
      const parts = repoInfo.split('/');
      if (parts.length !== 2) {
        alert('Invalid format. Enter owner/repo format.');
        return;
      }
      repoOwner = parts[0].trim();
      repoName = parts[1].trim();
      localStorage.setItem('github-owner', repoOwner);
      localStorage.setItem('github-repo', repoName);
    }

    updateSaveStatus('saving', 'Saving to GitHub...');

    try {
      // Get current file SHA if exists (for update)
      let sha = null;
      try {
        const getResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        if (getResponse.ok) {
          const fileData = await getResponse.json();
          sha = fileData.sha;
        }
      } catch (e) {
        // File doesn't exist, will create new
      }

      // Save to GitHub
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: sha ? `Update ${path}` : `Create ${path}`,
            content: btoa(unescape(encodeURIComponent(content))),
            sha: sha
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save to GitHub');
      }

      lastSavedContent = content;
      currentPostPath = path;
      clearDraft();
      updateSaveStatus('success', 'GitHub saved successfully');
    } catch (error) {
      console.error('GitHub save error:', error);
      updateSaveStatus('error', `GitHub save failed: ${error.message}`);
      alert(`GitHub save failed: ${error.message}`);
    }
  }

  function setupGitHubToken() {
    const currentToken = localStorage.getItem('github-token');
    const token = prompt(
      `Enter your GitHub Personal Access Token:\n\n` +
      `Create token: https://github.com/settings/tokens\n` +
      `Required permission: repo (full repository access)\n\n` +
      (currentToken ? `Current token: ${currentToken.substring(0, 10)}...` : 'Token is not set.'),
      currentToken || ''
    );
    
    if (token) {
      localStorage.setItem('github-token', token);
      alert('GitHub token saved.');
      
      // Also ask for repo info
      const repoInfo = prompt('Enter the GitHub repository information:\nFormat: owner/repo\nExample: username/taeylog');
      if (repoInfo) {
        const parts = repoInfo.split('/');
        if (parts.length === 2) {
          localStorage.setItem('github-owner', parts[0].trim());
          localStorage.setItem('github-repo', parts[1].trim());
        }
      }
    }
  }

  // Category selector functions
  async function loadCategories() {
    // In production, use GitHub API; in development, try local API first
    if (isLocalApiAvailable()) {
      try {
        const response = await fetch(getApiUrl('/api/categories'));
        if (response.ok) {
          const data = await response.json();
          categoriesData = data.categories || [];
          renderCategoryTree();
          return;
        }
      } catch (error) {
        console.warn('Local API not available, trying GitHub API...', error);
  }
    }
    
    // Fallback to GitHub API or local posts
    await loadCategoriesFromGitHub();
  }

  // Load categories from GitHub API (production) or local posts (development fallback)
  async function loadCategoriesFromGitHub() {
    const githubToken = localStorage.getItem('github-token');
    const repoOwner = localStorage.getItem('github-owner');
    const repoName = localStorage.getItem('github-repo');
    
    // Try GitHub API if token is available
    if (githubToken && repoOwner && repoName) {
      try {
        await loadCategoriesFromGitHubAPI(repoOwner, repoName, githubToken);
        return;
      } catch (error) {
        console.warn('Failed to load categories from GitHub API:', error);
      }
    }
    
    // Fallback: Try local API posts endpoint (development only)
    if (isLocalApiAvailable()) {
      try {
        await loadCategoriesFromLocalPosts();
        return;
      } catch (error) {
        console.warn('Failed to load categories from local API:', error);
      }
    }
    
    // Last resort: Show message
    const treeEl = document.getElementById('category-tree');
    if (treeEl) {
      if (!githubToken) {
        treeEl.innerHTML = `<div class="text-info text-center p-3">
          <i class="fas fa-info-circle"></i> 
          <div class="mt-2">Please set up GitHub token to load categories.</div>
          <div class="mt-2"><button class="btn btn-sm btn-primary" onclick="setupGitHubToken()">Setup GitHub</button></div>
        </div>`;
      } else {
        treeEl.innerHTML = `<div class="text-warning text-center p-3">
          <i class="fas fa-exclamation-triangle"></i> 
          <div class="mt-2">Failed to load categories. You can still create new categories manually.</div>
        </div>`;
      }
    }
  }

  // Load categories from GitHub API
  async function loadCategoriesFromGitHubAPI(repoOwner, repoName, githubToken) {
    // Get all files in _posts directory using GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/_posts`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from GitHub API');
    }
    
    const entries = await response.json();
    const categoriesMap = new Map();
    
    // Recursively process directories
    async function processEntry(entry, parentPath = '') {
      if (entry.type === 'dir') {
        const categoryName = entry.name;
        const categoryPath = parentPath ? `${parentPath}/${categoryName}` : categoryName;
        
        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, {
            name: categoryName,
            subcategories: []
          });
        }
        
        // Get subdirectories
        const subResponse = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/contents/_posts/${categoryPath}`,
          {
            headers: {
              'Authorization': `token ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        
        if (subResponse.ok) {
          const subEntries = await subResponse.json();
          for (const subEntry of subEntries) {
            if (subEntry.type === 'dir') {
              const subcategoryName = subEntry.name;
              const category = categoriesMap.get(categoryName);
              if (!category.subcategories.includes(subcategoryName)) {
                category.subcategories.push(subcategoryName);
              }
            }
          }
        }
      }
    }
    
    // Process all top-level directories
    for (const entry of entries) {
      if (entry.type === 'dir') {
        await processEntry(entry);
      }
    }
    
    categoriesData = Array.from(categoriesMap.values())
      .map(cat => ({
        name: cat.name,
        subcategories: cat.subcategories.sort()
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    renderCategoryTree();
  }

  // Load categories from local API posts endpoint (development fallback)
  async function loadCategoriesFromLocalPosts() {
    const response = await fetch(getApiUrl('/api/posts'));
    if (!response.ok) {
      throw new Error('Failed to load posts');
    }
    const data = await response.json();
    
    // Extract categories from post paths
    const categoriesMap = new Map();
    if (data.posts) {
      data.posts.forEach(post => {
        // Parse path: _posts/category/subcategory/date-title.md
        const match = post.path.match(/^_posts\/([^\/]+)(?:\/([^\/]+))?\//);
        if (match) {
          const categoryName = match[1];
          const subcategoryName = match[2];
          
          if (!categoriesMap.has(categoryName)) {
            categoriesMap.set(categoryName, {
              name: categoryName,
              subcategories: []
            });
          }
          
          if (subcategoryName) {
            const category = categoriesMap.get(categoryName);
            if (!category.subcategories.includes(subcategoryName)) {
              category.subcategories.push(subcategoryName);
            }
          }
        }
      });
    }
    
    categoriesData = Array.from(categoriesMap.values())
      .map(cat => ({
        name: cat.name,
        subcategories: cat.subcategories.sort()
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    renderCategoryTree();
  }

  function renderCategoryTree(filterText = '') {
    const treeEl = document.getElementById('category-tree');
    if (!treeEl) return;

    if (categoriesData.length === 0) {
      treeEl.innerHTML = '<div class="text-muted text-center p-3">No categories found</div>';
      return;
    }

    const filter = filterText.toLowerCase();
    let html = '<ul class="category-list">';
    
    categoriesData.forEach(category => {
      const categoryMatch = category.name.toLowerCase().includes(filter);
      const subcategoryMatches = category.subcategories.filter(sub => 
        sub.toLowerCase().includes(filter)
      );
      
      if (!categoryMatch && subcategoryMatches.length === 0) {
        return; // Skip this category if it doesn't match filter
      }

      html += `<li class="category-item">
        <div class="category-header" onclick="toggleCategory('${category.name}')">
          <i class="fas fa-chevron-right category-arrow" id="arrow-${category.name}"></i>
          <i class="fas fa-folder"></i>
          <span class="category-name" onclick="event.stopPropagation(); selectCategory('${category.name}')">${escapeHtml(category.name)}</span>
        </div>
        <ul class="subcategory-list" id="subcat-${category.name}" style="display: none;">`;
      
      category.subcategories.forEach(subcategory => {
        if (!filter || subcategory.toLowerCase().includes(filter)) {
          const isSelected = selectedCategory === category.name && selectedSubcategory === subcategory;
          html += `<li class="subcategory-item ${isSelected ? 'selected' : ''}" onclick="selectSubcategory('${category.name}', '${subcategory}')">
            <i class="fas fa-folder-open"></i>
            <span>${escapeHtml(subcategory)}</span>
          </li>`;
        }
      });
      
      html += '</ul></li>';
    });
    
    html += '</ul>';
    treeEl.innerHTML = html;

    // Expand selected category
    if (selectedCategory) {
      toggleCategory(selectedCategory, true);
    }
  }

  function toggleCategory(categoryName, forceOpen = false) {
    const subcatList = document.getElementById(`subcat-${categoryName}`);
    const arrow = document.getElementById(`arrow-${categoryName}`);
    
    if (!subcatList || !arrow) return;
    
    const isOpen = subcatList.style.display !== 'none';
    
    if (forceOpen || !isOpen) {
      subcatList.style.display = 'block';
      arrow.classList.remove('fa-chevron-right');
      arrow.classList.add('fa-chevron-down');
    } else {
      subcatList.style.display = 'none';
      arrow.classList.remove('fa-chevron-down');
      arrow.classList.add('fa-chevron-right');
    }
  }

  function selectCategory(categoryName) {
    selectedCategory = categoryName;
    selectedSubcategory = null;
    updateCategoryDisplay();
    updatePostPath();
    renderCategoryTree(document.getElementById('category-search')?.value || '');
  }

  function selectSubcategory(categoryName, subcategoryName) {
    selectedCategory = categoryName;
    selectedSubcategory = subcategoryName;
    updateCategoryDisplay();
    updatePostPath();
    renderCategoryTree(document.getElementById('category-search')?.value || '');
  }

  function updateCategoryDisplay() {
    const displayEl = document.getElementById('category-display');
    if (!displayEl) return;
    
    if (selectedSubcategory) {
      displayEl.textContent = `${selectedCategory} / ${selectedSubcategory}`;
    } else if (selectedCategory) {
      displayEl.textContent = selectedCategory;
    } else {
      displayEl.textContent = 'Select Category';
    }
  }

  function updatePostPath() {
    if (!selectedCategory) {
      const pathInput = document.getElementById('post-path');
      if (pathInput) pathInput.value = '';
      return;
    }

    const titleInput = document.getElementById('post-title');
    const title = titleInput?.value?.trim() || '';
    
    // Generate filename from title or use date
    let filename = '';
    if (title) {
      // Convert title to filename-friendly format
      filename = title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    if (!filename) {
      const today = new Date().toISOString().split('T')[0];
      filename = `${today}-post`;
    }

    // Build path
    let path = `_posts/${selectedCategory}`;
    if (selectedSubcategory) {
      path += `/${selectedSubcategory}`;
    }
    path += `/${filename}.md`;

    const pathInput = document.getElementById('post-path');
    if (pathInput) {
      pathInput.value = path;
      currentPostPath = path;
    }
  }

  function toggleCategorySelector() {
    const selector = document.getElementById('category-selector');
    if (!selector) return;
    
    const isVisible = selector.style.display !== 'none';
    selector.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible && categoriesData.length === 0) {
      loadCategories();
    }
  }

  function filterCategories(filterText) {
    renderCategoryTree(filterText);
  }

  function addNewCategory() {
    const categoryName = prompt('Enter new category name:');
    if (!categoryName || !categoryName.trim()) return;
    
    const subcategoryName = prompt('Enter subcategory name (optional, leave empty for no subcategory):');
    
    selectedCategory = categoryName.trim();
    selectedSubcategory = subcategoryName?.trim() || null;
    
    // Add to categories data if not exists
    let category = categoriesData.find(c => c.name === selectedCategory);
    if (!category) {
      category = {
        name: selectedCategory,
        subcategories: []
      };
      categoriesData.push(category);
      categoriesData.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    if (selectedSubcategory && !category.subcategories.includes(selectedSubcategory)) {
      category.subcategories.push(selectedSubcategory);
      category.subcategories.sort();
    }
    
    updateCategoryDisplay();
    updatePostPath();
    renderCategoryTree();
    
    // Close selector
    document.getElementById('category-selector').style.display = 'none';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Listen to title input changes to update path
  document.addEventListener('DOMContentLoaded', function() {
    const titleInput = document.getElementById('post-title');
    if (titleInput) {
      titleInput.addEventListener('input', function() {
        if (selectedCategory) {
          updatePostPath();
        }
      });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
  } else {
    initEditor();
  }
})();
