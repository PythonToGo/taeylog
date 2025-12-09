/**
 * 관리자 페이지 기능
 * GitHub API를 사용하여 포스트 생성, 수정, 목록 조회
 */

(function() {
  'use strict';

  // 설정
  const GITHUB_REPO = 'PythonToGo/PythonToGo.github.io';
  const GITHUB_BRANCH = 'main';
  const GITHUB_USERNAME = 'PythonToGo';
  const ADMIN_PASSWORD_KEY = 'admin_password'; // 간단한 비밀번호 인증용

  let mdeEditor = null;
  let currentPostPath = null;

  // GitHub API 헤더 생성
  function getAuthHeaders() {
    const token = localStorage.getItem('github_pat');
    if (!token) {
      throw new Error('GitHub 토큰이 필요합니다.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  // 관리자 로그인 확인
  async function checkAdminAuth() {
    // GitHub 인증 확인
    if (window.GitHubAuth) {
      const isAuth = await window.GitHubAuth.isAuthenticated();
      if (isAuth) {
        const username = await window.GitHubAuth.getUsername();
        if (username === GITHUB_USERNAME) {
          return true;
        }
      }
    }
    
    // 간단한 비밀번호 인증 (개발용)
    const savedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY);
    return savedPassword === 'admin'; // 실제로는 더 안전한 방법 사용 권장
  }

  // 관리자 로그인 처리
  async function handleLogin() {
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('auth-error');

    // GitHub 인증 시도
    if (window.GitHubAuth) {
      const isAuth = await window.GitHubAuth.isAuthenticated();
      if (isAuth) {
        const username = await window.GitHubAuth.getUsername();
        if (username === GITHUB_USERNAME) {
          showAdminEditor();
          return;
        }
      }
    }

    // 간단한 비밀번호 인증 (개발용)
    if (password === 'admin') {
      localStorage.setItem(ADMIN_PASSWORD_KEY, password);
      showAdminEditor();
    } else {
      errorDiv.textContent = '비밀번호가 올바르지 않습니다.';
      errorDiv.style.display = 'block';
    }
  }

  // 관리자 에디터 표시
  function showAdminEditor() {
    document.getElementById('admin-auth').style.display = 'none';
    document.getElementById('admin-editor').style.display = 'block';
    initEditor();
  }

  // EasyMDE 에디터 초기화
  function initEditor() {
    if (mdeEditor) {
      return;
    }

    mdeEditor = new EasyMDE({
      element: document.getElementById('mde-editor'),
      spellChecker: false,
      autosave: {
        enabled: true,
        uniqueId: 'admin-post-editor',
        delay: 1000,
      },
      toolbar: [
        'bold', 'italic', 'strikethrough', '|',
        'heading-1', 'heading-2', 'heading-3', '|',
        'code', 'quote', 'unordered-list', 'ordered-list', '|',
        'link', 'image', 'table', '|',
        'preview', 'side-by-side', 'fullscreen', '|',
        'guide'
      ]
    });
  }

  // 새 포스트 작성
  function newPost() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0].substring(0, 5);

    document.getElementById('post-title').value = '';
    document.getElementById('post-date').value = dateStr;
    document.getElementById('post-time').value = timeStr;
    document.getElementById('post-categories').value = '';
    document.getElementById('post-tags').value = '';
    document.getElementById('post-pin').checked = false;
    document.getElementById('post-math').checked = false;
    document.getElementById('post-mermaid').checked = false;
    document.getElementById('post-comments').checked = true;

    if (mdeEditor) {
      mdeEditor.value('');
    }

    currentPostPath = null;
    document.getElementById('save-status').textContent = '';
  }

  // 포스트 목록 로드
  async function loadPosts() {
    const postListDiv = document.getElementById('post-list');
    const isVisible = postListDiv.style.display !== 'none';

    if (isVisible) {
      postListDiv.style.display = 'none';
      return;
    }

    try {
      const token = localStorage.getItem('github_pat');
      if (!token) {
        alert('GitHub 토큰이 필요합니다. GitHub로 로그인해주세요.');
        if (window.GitHubAuth) {
          window.GitHubAuth.login();
        }
        return;
      }

      // GitHub API로 _posts 디렉토리 파일 목록 가져오기
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/_posts`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('포스트 목록을 가져올 수 없습니다.');
      }

      const files = await response.json();
      const posts = files
        .filter(file => file.name.endsWith('.md'))
        .sort((a, b) => b.name.localeCompare(a.name));

      let html = '<h4>포스트 목록</h4>';
      posts.forEach(post => {
        html += `<div class="post-item" data-path="${post.path}">${post.name}</div>`;
      });

      postListDiv.innerHTML = html;
      postListDiv.style.display = 'block';

      // 포스트 클릭 이벤트
      postListDiv.querySelectorAll('.post-item').forEach(item => {
        item.addEventListener('click', () => {
          loadPost(item.dataset.path);
        });
      });

    } catch (error) {
      console.error('Error loading posts:', error);
      alert('포스트 목록을 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // 포스트 로드
  async function loadPost(filePath) {
    try {
      const token = localStorage.getItem('github_pat');
      if (!token) {
        alert('GitHub 토큰이 필요합니다.');
        return;
      }

      // GitHub API로 파일 내용 가져오기
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('포스트를 불러올 수 없습니다.');
      }

      const file = await response.json();
      const content = atob(file.content.replace(/\n/g, ''));

      // Front matter 파싱
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!frontMatterMatch) {
        throw new Error('포스트 형식이 올바르지 않습니다.');
      }

      const frontMatter = frontMatterMatch[1];
      const body = frontMatterMatch[2];

      // Front matter 파싱
      const titleMatch = frontMatter.match(/title:\s*["'](.+?)["']/);
      const dateMatch = frontMatter.match(/date:\s*(.+?)(?:\s|$)/);
      const categoriesMatch = frontMatter.match(/categories:\s*\[(.+?)\]/);
      const tagsMatch = frontMatter.match(/tags:\s*\[(.+?)\]/);
      const pinMatch = frontMatter.match(/pin:\s*(true|false)/);
      const mathMatch = frontMatter.match(/math:\s*(true|false)/);
      const mermaidMatch = frontMatter.match(/mermaid:\s*(true|false)/);
      const commentsMatch = frontMatter.match(/comments:\s*(true|false)/);

      if (titleMatch) {
        document.getElementById('post-title').value = titleMatch[1];
      }
      if (dateMatch) {
        const dateStr = dateMatch[1].split(' ')[0];
        const timeStr = dateMatch[1].split(' ')[1] || '12:00';
        document.getElementById('post-date').value = dateStr;
        document.getElementById('post-time').value = timeStr.substring(0, 5);
      }
      if (categoriesMatch) {
        const categories = categoriesMatch[1]
          .split(',')
          .map(c => c.trim().replace(/["']/g, ''))
          .filter(c => c);
        document.getElementById('post-categories').value = categories.join(', ');
      }
      if (tagsMatch) {
        const tags = tagsMatch[1]
          .split(',')
          .map(t => t.trim().replace(/["']/g, ''))
          .filter(t => t);
        document.getElementById('post-tags').value = tags.join(', ');
      }
      document.getElementById('post-pin').checked = pinMatch && pinMatch[1] === 'true';
      document.getElementById('post-math').checked = mathMatch && mathMatch[1] === 'true';
      document.getElementById('post-mermaid').checked = mermaidMatch && mermaidMatch[1] === 'true';
      document.getElementById('post-comments').checked = !commentsMatch || commentsMatch[1] === 'true';

      if (mdeEditor) {
        mdeEditor.value(body);
      }

      currentPostPath = filePath;
      document.getElementById('post-list').style.display = 'none';
      document.getElementById('save-status').textContent = '';

    } catch (error) {
      console.error('Error loading post:', error);
      alert('포스트를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // 포스트 저장
  async function savePost() {
    try {
      const token = localStorage.getItem('github_pat');
      if (!token) {
        alert('GitHub 토큰이 필요합니다. GitHub로 로그인해주세요.');
        if (window.GitHubAuth) {
          window.GitHubAuth.login();
        }
        return;
      }

      const title = document.getElementById('post-title').value.trim();
      if (!title) {
        alert('제목을 입력해주세요.');
        return;
      }

      const date = document.getElementById('post-date').value;
      const time = document.getElementById('post-time').value;
      const categories = document.getElementById('post-categories').value
        .split(',')
        .map(c => c.trim())
        .filter(c => c)
        .map(c => `"${c}"`);
      const tags = document.getElementById('post-tags').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t)
        .map(t => `"${t}"`);
      const pin = document.getElementById('post-pin').checked;
      const math = document.getElementById('post-math').checked;
      const mermaid = document.getElementById('post-mermaid').checked;
      const comments = document.getElementById('post-comments').checked;

      const content = mdeEditor ? mdeEditor.value() : '';

      // Front matter 생성
      const frontMatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date} ${time}:00
categories: [${categories.join(', ')}]
tags: [${tags.join(', ')}]
pin: ${pin}
math: ${math}
mermaid: ${mermaid}
comments: ${comments}
---

${content}`;

      // 파일명 생성
      const dateStr = date.replace(/-/g, '-');
      const titleSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const filename = `${dateStr}-${titleSlug}.md`;
      const filePath = `_posts/${filename}`;

      // GitHub API로 파일 저장
      let sha = null;
      if (currentPostPath) {
        // 기존 파일인 경우 SHA 가져오기
        const getResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${currentPostPath}`,
          {
            headers: getAuthHeaders()
          }
        );
        if (getResponse.ok) {
          const file = await getResponse.json();
          sha = file.sha;
        }
      }

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
        {
          method: currentPostPath ? 'PUT' : 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message: currentPostPath ? `Update post: ${title}` : `Create post: ${title}`,
            content: btoa(unescape(encodeURIComponent(frontMatter))),
            branch: GITHUB_BRANCH,
            ...(sha && { sha })
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '포스트 저장에 실패했습니다.');
      }

      document.getElementById('save-status').textContent = '✓ 저장 완료!';
      document.getElementById('save-status').style.color = 'green';
      currentPostPath = filePath;

      setTimeout(() => {
        document.getElementById('save-status').textContent = '';
      }, 3000);

    } catch (error) {
      console.error('Error saving post:', error);
      alert('포스트 저장 중 오류가 발생했습니다: ' + error.message);
      document.getElementById('save-status').textContent = '✗ 저장 실패';
      document.getElementById('save-status').style.color = 'red';
    }
  }

  // 프리뷰 표시
  function showPreview() {
    const previewContainer = document.getElementById('preview-container');
    const previewContent = document.getElementById('preview-content');
    const content = mdeEditor ? mdeEditor.value() : '';

    // 간단한 마크다운 프리뷰 (실제로는 마크다운 파서 사용 권장)
    previewContent.innerHTML = mdeEditor ? mdeEditor.preview() : '';
    previewContainer.style.display = previewContainer.style.display === 'none' ? 'block' : 'none';
  }

  // 초기화
  async function init() {
    // 로그인 상태 확인
    const isAuth = await checkAdminAuth();
    if (isAuth) {
      showAdminEditor();
    }

    // 이벤트 리스너 등록
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
    document.getElementById('new-post-btn').addEventListener('click', newPost);
    document.getElementById('load-posts-btn').addEventListener('click', loadPosts);
    document.getElementById('save-post-btn').addEventListener('click', savePost);
    document.getElementById('preview-post-btn').addEventListener('click', showPreview);
  }

  // DOM 로드 완료 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

