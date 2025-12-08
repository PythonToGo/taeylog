/**
 * Admin 페이지 기능
 * 포스트 작성, 수정, 목록 조회 등을 담당합니다
 */

(function() {
  'use strict';

  let editor = null;
  let currentPostPath = null;

  // EasyMDE 에디터 초기화
  function initEditor() {
    if (document.getElementById('mde-editor') && !editor) {
      editor = new EasyMDE({
        element: document.getElementById('mde-editor'),
        spellChecker: false,
        autosave: {
          enabled: true,
          uniqueId: 'admin-editor',
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
  }

  // 새 포스트 작성
  function newPost() {
    // 폼 초기화
    document.getElementById('post-title').value = '';
    document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('post-time').value = '12:00';
    document.getElementById('post-categories').value = '';
    document.getElementById('post-tags').value = '';
    document.getElementById('post-pin').checked = false;
    document.getElementById('post-math').checked = false;
    document.getElementById('post-mermaid').checked = false;
    document.getElementById('post-comments').checked = true;
    
    if (editor) {
      editor.value('');
    }
    
    currentPostPath = null;
    document.getElementById('save-status').textContent = '';
  }

  // 포스트 저장
  async function savePost() {
    if (!window.githubAuth || !window.githubAuth.isAuthenticated()) {
      alert('먼저 GitHub로 로그인해주세요.');
      return;
    }

    const title = document.getElementById('post-title').value.trim();
    if (!title) {
      alert('제목을 입력해주세요.');
      return;
    }

    const date = document.getElementById('post-date').value;
    const time = document.getElementById('post-time').value;
    const categories = document.getElementById('post-categories').value.split(',').map(c => c.trim()).filter(c => c);
    const tags = document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t);
    const pin = document.getElementById('post-pin').checked;
    const math = document.getElementById('post-math').checked;
    const mermaid = document.getElementById('post-mermaid').checked;
    const comments = document.getElementById('post-comments').checked;
    const content = editor ? editor.value() : '';

    // 날짜와 시간을 결합하여 Jekyll 날짜 형식 생성
    const dateTime = new Date(`${date}T${time}`);
    const jekyllDate = dateTime.toISOString().split('T')[0];
    const jekyllTime = dateTime.toTimeString().split(' ')[0];
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formattedDate = `${jekyllDate} ${jekyllTime} ${timezone}`;

    // Front matter 생성
    let frontMatter = `---
title: ${title}
date: ${formattedDate}
`;
    
    if (categories.length > 0) {
      frontMatter += `categories: [${categories.map(c => c).join(', ')}]
`;
    }
    
    if (tags.length > 0) {
      frontMatter += `tags: [${tags.map(t => t).join(', ')}]
`;
    }
    
    if (pin) frontMatter += `pin: true
`;
    if (math) frontMatter += `math: true
`;
    if (mermaid) frontMatter += `mermaid: true
`;
    if (!comments) frontMatter += `comments: false
`;
    
    frontMatter += `---

${content}`;

    // 파일명 생성 (제목을 파일명으로 변환)
    const filename = title.toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const filePath = `_posts/${jekyllDate}-${filename}.md`;

    try {
      const statusEl = document.getElementById('save-status');
      statusEl.textContent = '저장 중...';
      statusEl.style.color = 'blue';

      // GitHub API를 사용하여 파일 생성/수정
      // TODO: 실제 GitHub API 호출 구현 필요
      // 현재는 로컬 스토리지에 저장만 함
      localStorage.setItem('admin-draft-' + filePath, frontMatter);
      
      statusEl.textContent = '저장 완료 (로컬 스토리지)';
      statusEl.style.color = 'green';
      
      setTimeout(() => {
        statusEl.textContent = '';
      }, 3000);

      currentPostPath = filePath;
    } catch (error) {
      console.error('Save error:', error);
      const statusEl = document.getElementById('save-status');
      statusEl.textContent = '저장 실패: ' + error.message;
      statusEl.style.color = 'red';
    }
  }

  // 포스트 프리뷰
  function previewPost() {
    const content = editor ? editor.value() : '';
    const previewContent = document.getElementById('preview-content');
    const previewContainer = document.getElementById('preview-container');
    
    // 간단한 마크다운 프리뷰 (실제로는 마크다운 파서 필요)
    previewContent.innerHTML = '<pre>' + content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
    previewContainer.style.display = 'block';
  }

  // 포스트 목록 로드
  async function loadPosts() {
    // TODO: GitHub API를 사용하여 포스트 목록 가져오기
    const postList = document.getElementById('post-list');
    postList.style.display = 'block';
    postList.innerHTML = '<p>포스트 목록 기능은 아직 구현되지 않았습니다.</p>';
  }

  // 이벤트 리스너 등록
  document.addEventListener('DOMContentLoaded', () => {
    // 인증 확인 후 에디터 초기화
    if (window.githubAuth && window.githubAuth.isAuthenticated()) {
      setTimeout(initEditor, 500);
    } else {
      window.addEventListener('github-auth-success', () => {
        setTimeout(initEditor, 500);
      });
    }

    // 버튼 이벤트
    const newPostBtn = document.getElementById('new-post-btn');
    if (newPostBtn) {
      newPostBtn.addEventListener('click', newPost);
    }

    const savePostBtn = document.getElementById('save-post-btn');
    if (savePostBtn) {
      savePostBtn.addEventListener('click', savePost);
    }

    const previewPostBtn = document.getElementById('preview-post-btn');
    if (previewPostBtn) {
      previewPostBtn.addEventListener('click', previewPost);
    }

    const loadPostsBtn = document.getElementById('load-posts-btn');
    if (loadPostsBtn) {
      loadPostsBtn.addEventListener('click', loadPosts);
    }

    // URL 파라미터 확인 (edit 모드)
    const urlParams = new URLSearchParams(window.location.search);
    const editTitle = urlParams.get('edit');
    if (editTitle) {
      // TODO: 포스트 로드 기능 구현
      console.log('Edit mode for:', editTitle);
    }

    const newMode = urlParams.get('new');
    if (newMode === 'true') {
      setTimeout(() => {
        if (window.githubAuth && window.githubAuth.isAuthenticated()) {
          newPost();
        }
      }, 1000);
    }
  });
})();
