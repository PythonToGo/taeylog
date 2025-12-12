/**
 * Edit/Create 버튼 추가 및 처리
 * GitHub 인증 후에만 버튼이 표시되고, 클릭 시 GitHub의 파일 편집 페이지로 이동
 */

(function () {
  'use strict';

  // 설정
  const GITHUB_REPO = 'PythonToGo/PythonToGo.github.io';
  const GITHUB_BRANCH = 'main'; // 또는 'master'
  const GITHUB_USERNAME = 'PythonToGo';

  // GitHub 파일 편집 URL 생성
  function getEditUrl(filePath) {
    return `https://github.com/${GITHUB_REPO}/edit/${GITHUB_BRANCH}/${filePath}`;
  }

  // 새 포스트 생성 URL
  function getCreatePostUrl() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const filename = `${dateStr}-new-post.md`;
    return `https://github.com/${GITHUB_REPO}/new/${GITHUB_BRANCH}/_posts?filename=${encodeURIComponent(
      filename
    )}&value=${encodeURIComponent(getDefaultPostContent())}`;
  }

  // 기본 포스트 내용
  function getDefaultPostContent() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0].substring(0, 5);

    return `---
title: "새 포스트"
date: ${dateStr} ${timeStr}:00
categories: []
tags: []
pin: false
math: false
mermaid: false
comments: true
---

여기에 포스트 내용을 작성하세요.
`;
  }

  // 현재 포스트의 파일 경로 찾기
  function getCurrentPostPath() {
    // Jekyll의 permalink 구조: /posts/:title/
    const path = window.location.pathname;
    const match = path.match(/\/posts\/([^\/]+)\/?$/);

    if (!match) {
      return null;
    }

    const urlTitle = match[1];
    let dateStr = null;

    // 방법 1: 페이지의 메타데이터에서 날짜 가져오기
    const metaDate = document.querySelector(
      'meta[property="article:published_time"]'
    );
    if (metaDate) {
      dateStr = metaDate.getAttribute('content').split('T')[0];
    }

    // 방법 2: time 요소에서 날짜 가져오기
    if (!dateStr) {
      const timeElement = document.querySelector('time[datetime]');
      if (timeElement) {
        dateStr = timeElement.getAttribute('datetime').split('T')[0];
      }
    }

    // 방법 3: post-meta에서 날짜 찾기
    if (!dateStr) {
      const postMeta = document.querySelector(
        '.post-meta time, .post-meta .time'
      );
      if (postMeta) {
        const datetime =
          postMeta.getAttribute('datetime') || postMeta.textContent;
        if (datetime) {
          const dateMatch = datetime.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            dateStr = dateMatch[1];
          }
        }
      }
    }

    // 방법 4: 페이지 제목 근처에서 날짜 찾기
    if (!dateStr) {
      const pageTitle = document.querySelector(
        'h1.post-title, h1.page-title, h1'
      );
      if (pageTitle) {
        const parent = pageTitle.parentElement;
        if (parent) {
          const dateElement = parent.querySelector('time[datetime]');
          if (dateElement) {
            dateStr = dateElement.getAttribute('datetime').split('T')[0];
          }
        }
      }
    }

    // 날짜를 찾지 못한 경우 null 반환 (GitHub에서 파일을 찾을 수 없을 수 있음)
    if (!dateStr) {
      console.warn(
        '포스트 날짜를 찾을 수 없습니다. URL title만 사용합니다:',
        urlTitle
      );
      // 날짜 없이 시도 (실제 파일명과 다를 수 있음)
      const filename = urlTitle.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      return `_posts/${filename}.md`;
    }

    // URL title을 파일명으로 변환 (특수문자 제거, 하이픈으로 변환)
    const filename = urlTitle
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `_posts/${dateStr}-${filename}.md`;
  }

  // Edit 버튼 추가 (포스트 페이지) - reading time 아래에 추가
  function addEditButton() {
    // 이미 버튼이 있으면 추가하지 않음
    if (document.getElementById('post-edit-button')) {
      console.log('ℹ️ Edit 버튼이 이미 존재합니다.');
      return;
    }

    const postPath = getCurrentPostPath();
    if (!postPath) {
      console.warn('⚠️ 포스트 경로를 찾을 수 없습니다.');
      return;
    }

    console.log('🔍 Edit 버튼 추가 시도 중... 포스트 경로:', postPath);

    // reading time 요소 찾기 (Chirpy 테마에서 여러 가능한 위치)
    let readingTimeElement = null;

    // 방법 1: .readtime 클래스 찾기 (Chirpy 테마의 실제 클래스명)
    readingTimeElement = document.querySelector(
      '.readtime, .reading-time, .post-reading-time, [data-reading-time]'
    );

    // 방법 2: .post-meta 내에서 "분" 또는 "min" 텍스트를 포함한 요소 찾기
    if (!readingTimeElement) {
      const postMeta = document.querySelector('.post-meta');
      if (postMeta) {
        const metaItems = postMeta.querySelectorAll('span, div, li');
        for (let item of metaItems) {
          const text = item.textContent || '';
          if (
            text.includes('분') ||
            text.includes('min') ||
            text.includes('read')
          ) {
            readingTimeElement = item;
            break;
          }
        }
      }
    }

    // 방법 3: .post-meta 전체를 사용
    if (!readingTimeElement) {
      readingTimeElement = document.querySelector('.post-meta');
    }

    // 방법 4: .post-header 내에서 찾기
    if (!readingTimeElement) {
      const postHeader = document.querySelector(
        '.post-header, header.post-header'
      );
      if (postHeader) {
        const timeElements = postHeader.querySelectorAll('span, div, time');
        for (let elem of timeElements) {
          const text = elem.textContent || '';
          if (
            text.includes('분') ||
            text.includes('min') ||
            text.includes('read')
          ) {
            readingTimeElement = elem;
            break;
          }
        }
      }
    }

    // reading time 요소를 찾지 못한 경우, post-meta를 기본으로 사용
    if (!readingTimeElement) {
      readingTimeElement = document.querySelector(
        '.post-meta, .post-header, header.post-header'
      );
    }

    if (!readingTimeElement) {
      console.warn(
        'reading time 요소를 찾을 수 없습니다. 기본 위치에 버튼을 추가합니다.'
      );
      // 기본 위치에 추가
      const defaultContainer = document.querySelector(
        '.post-title, h1.post-title, main, .content'
      );
      if (defaultContainer) {
        const editButton = createEditButton(postPath);
        defaultContainer.parentNode.insertBefore(
          editButton,
          defaultContainer.nextSibling
        );
      }
      return;
    }

    // reading time 요소 다음에 버튼 추가
    const editButton = createEditButton(postPath);

    // Chirpy 테마 구조: .post-meta > div.d-flex.justify-content-between > div > span.readtime
    // 버튼은 .post-meta div의 마지막에 추가 (reading time이 있는 div 다음)
    const postMeta = document.querySelector('.post-meta');
    if (postMeta) {
      // .post-meta div의 마지막에 버튼 추가
      // 이렇게 하면 reading time이 있는 div 다음에 버튼이 나타남
      postMeta.appendChild(editButton);
      console.log('✅ Edit 버튼이 .post-meta에 추가되었습니다.');
    } else {
      console.warn('⚠️ .post-meta를 찾을 수 없습니다. 대체 방법 시도 중...');
      // .post-meta를 찾지 못한 경우, reading time 요소의 부모 컨테이너에 추가
      const parent = readingTimeElement.parentElement;
      if (parent) {
        // reading time이 있는 div의 부모(div.d-flex) 다음에 버튼 추가
        const flexContainer = parent.closest('.d-flex');
        if (flexContainer && flexContainer.parentElement) {
          flexContainer.parentElement.insertBefore(
            editButton,
            flexContainer.nextSibling
          );
        } else {
          // flexContainer를 찾지 못한 경우, reading time 다음에 추가
          if (readingTimeElement.nextSibling) {
            parent.insertBefore(editButton, readingTimeElement.nextSibling);
          } else {
            parent.appendChild(editButton);
          }
        }
      } else {
        // 부모가 없으면 reading time 다음에 직접 추가
        readingTimeElement.parentNode.insertBefore(
          editButton,
          readingTimeElement.nextSibling
        );
      }
    }

    // 디버깅용 로그 (개발 환경에서만)
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      console.log('Edit 버튼이 추가되었습니다:', editButton);
      console.log('Reading time 요소:', readingTimeElement);
      console.log('Post meta 요소:', postMeta);
    }
  }

  // Edit 버튼 생성 함수
  function createEditButton(postPath) {
    const editButton = document.createElement('button');
    editButton.id = 'post-edit-button';
    editButton.type = 'button';
    editButton.className = 'btn btn-sm btn-outline-primary';
    editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editButton.style.marginTop = '8px';
    editButton.style.marginBottom = '8px';
    editButton.style.display = 'block';

    // 버튼 클릭 시 GitHub OAuth 인증 후 파일로 이동
    editButton.onclick = function (e) {
      e.preventDefault();
      handleEditClick(postPath);
    };

    return editButton;
  }

  // Edit 버튼 클릭 처리 - GitHub OAuth 인증 후 파일로 이동
  function handleEditClick(postPath) {
    const editUrl = getEditUrl(postPath);

    // GitHub의 파일 편집 URL로 직접 이동하면 GitHub가 자동으로 로그인을 요구함
    // 로그인하지 않은 경우: GitHub 로그인 페이지로 리다이렉트
    // 로그인한 경우: 파일 편집 페이지로 이동
    // OAuth 인증이 필요한 경우 GitHub가 자동으로 처리함

    // 새 창에서 열기
    window.open(editUrl, '_blank', 'noopener,noreferrer');
  }

  // Create 버튼 추가 (홈 페이지)
  function addCreateButton() {
    // 이미 버튼이 있으면 추가하지 않음
    if (document.getElementById('post-create-button')) {
      return;
    }

    // 홈 페이지인지 확인
    const isHomePage =
      window.location.pathname === '/' ||
      window.location.pathname === '/index.html' ||
      document.body.classList.contains('home');

    if (!isHomePage) {
      return;
    }

    // 적절한 위치에 버튼 추가
    const mainContent =
      document.querySelector('main') ||
      document.querySelector('.content') ||
      document.body;

    if (!mainContent) {
      return;
    }

    const createButton = document.createElement('a');
    createButton.id = 'post-create-button';
    createButton.href = getCreatePostUrl();
    createButton.target = '_blank';
    createButton.rel = 'noopener noreferrer';
    createButton.className = 'btn btn-primary';
    createButton.innerHTML = '<i class="fas fa-plus"></i> 새 포스트 작성';
    createButton.style.position = 'fixed';
    createButton.style.bottom = '20px';
    createButton.style.right = '20px';
    createButton.style.zIndex = '1000';
    createButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

    mainContent.appendChild(createButton);
  }

  // 버튼 표시 (포스트 페이지에서는 항상 Edit 버튼 표시)
  async function showButtonsIfAuthenticated() {
    // 포스트 페이지인 경우 Edit 버튼 추가 (인증 여부와 관계없이 항상 표시)
    if (window.location.pathname.includes('/posts/')) {
      addEditButton();
    }

    // 홈 페이지인 경우 Create 버튼은 기존 로직 유지 (인증 필요)
    const isHomePage =
      window.location.pathname === '/' ||
      window.location.pathname === '/index.html' ||
      document.body.classList.contains('home');

    if (isHomePage) {
      // GitHub 인증 확인
      if (window.GitHubAuth) {
        const isAuth = await window.GitHubAuth.isAuthenticated();
        if (isAuth) {
          const username = await window.GitHubAuth.getUsername();
          if (username === GITHUB_USERNAME) {
            addCreateButton();
            return;
          }
        }
      }

      // 인증되지 않은 경우, 로그인 버튼 표시
      showLoginButton();
    }
  }

  // 로그인 버튼 표시 (홈 페이지용만)
  function showLoginButton() {
    // 이미 로그인 버튼이 있으면 추가하지 않음
    if (document.getElementById('github-login-button-home')) {
      return;
    }

    // 홈 페이지인 경우에만 로그인 버튼 표시
    const isHomePage =
      window.location.pathname === '/' ||
      window.location.pathname === '/index.html' ||
      document.body.classList.contains('home');

    if (!isHomePage) {
      return;
    }

    const loginButton = document.createElement('button');
    loginButton.id = 'github-login-button-home';
    loginButton.className = 'btn btn-primary';
    loginButton.innerHTML = '<i class="fab fa-github"></i> GitHub로 로그인';
    loginButton.onclick = function () {
      if (window.GitHubAuth) {
        window.GitHubAuth.login();
      } else {
        alert('GitHub 인증이 초기화되지 않았습니다.');
      }
    };
    loginButton.style.position = 'fixed';
    loginButton.style.bottom = '20px';
    loginButton.style.right = '20px';
    loginButton.style.zIndex = '1000';
    loginButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

    const mainContent =
      document.querySelector('main') ||
      document.querySelector('.content') ||
      document.body;
    if (mainContent) {
      mainContent.appendChild(loginButton);
    }
  }

  // 버튼 추가를 여러 번 시도하는 함수
  function tryAddButtons(maxAttempts = 10, delay = 500) {
    let attempts = 0;

    const attempt = () => {
      attempts++;

      // 포스트 페이지인 경우 Edit 버튼 추가 시도
      if (window.location.pathname.includes('/posts/')) {
        const postMeta = document.querySelector('.post-meta');
        const readtime = document.querySelector('.readtime');

        if (postMeta || readtime) {
          // 요소가 있으면 버튼 추가 시도
          addEditButton();

          // 버튼이 실제로 추가되었는지 확인
          const button = document.getElementById('post-edit-button');
          if (button) {
            console.log('✅ Edit 버튼이 성공적으로 추가되었습니다.');
            return; // 성공하면 종료
          }
        }

        // 요소가 아직 없으면 계속 시도
        if (attempts < maxAttempts) {
          console.log(`⏳ Edit 버튼 추가 시도 ${attempts}/${maxAttempts}...`);
          setTimeout(attempt, delay);
        } else {
          console.error(
            '❌ Edit 버튼을 추가할 수 없습니다. 요소를 찾을 수 없습니다.'
          );
          // 최후의 수단: 강제로 버튼 추가
          forceAddEditButton();
        }
      } else {
        // 포스트 페이지가 아니면 일반 로직 실행
        showButtonsIfAuthenticated();
      }
    };

    attempt();
  }

  // 강제로 Edit 버튼 추가 (최후의 수단)
  function forceAddEditButton() {
    const postPath = getCurrentPostPath();
    if (!postPath) {
      console.error('포스트 경로를 찾을 수 없습니다.');
      return;
    }

    // 여러 가능한 위치에 시도
    const possibleContainers = [
      document.querySelector('article header'),
      document.querySelector('.post-meta'),
      document.querySelector('article'),
      document.querySelector('main'),
      document.body,
    ];

    for (const container of possibleContainers) {
      if (container) {
        const editButton = createEditButton(postPath);
        container.appendChild(editButton);
        console.log('✅ 강제로 Edit 버튼을 추가했습니다:', container);
        return;
      }
    }

    console.error('❌ 버튼을 추가할 컨테이너를 찾을 수 없습니다.');
  }

  // 페이지 로드 시 실행
  function init() {
    console.log('🚀 Edit 버튼 스크립트 초기화 중...');
    console.log('현재 경로:', window.location.pathname);

    // DOM이 완전히 로드될 때까지 대기
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        console.log('📄 DOMContentLoaded 이벤트 발생');
        setTimeout(() => tryAddButtons(), 500);
      });
    } else {
      console.log('📄 DOM이 이미 로드됨');
      setTimeout(() => tryAddButtons(), 500);
    }

    // window.load 이벤트도 대기
    window.addEventListener('load', function () {
      console.log('🔄 window.load 이벤트 발생');
      setTimeout(() => tryAddButtons(5, 300), 1000);
    });

    // MutationObserver로 동적 콘텐츠 감지
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function (mutations) {
        const postMeta = document.querySelector('.post-meta');
        const readtime = document.querySelector('.readtime');
        const existingButton = document.getElementById('post-edit-button');

        if (
          (postMeta || readtime) &&
          !existingButton &&
          window.location.pathname.includes('/posts/')
        ) {
          console.log('👀 DOM 변경 감지 - Edit 버튼 추가 시도');
          setTimeout(() => addEditButton(), 200);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // 10초 후 observer 중지
      setTimeout(() => {
        observer.disconnect();
        console.log('⏹️ MutationObserver 중지');
      }, 10000);
    }
  }

  // 초기화 실행
  init();

  // 페이지 전환 시에도 작동하도록 (SPA나 AJAX 네비게이션 대응)
  window.addEventListener('popstate', function () {
    setTimeout(() => tryAddButtons(), 500);
  });

  // 전역 함수로 export
  window.EditButtons = {
    showButtons: showButtonsIfAuthenticated,
    addEditButton: addEditButton,
    addCreateButton: addCreateButton,
  };
})();
