---
layout: page
icon: fas fa-edit
order: 99
---

<div id="admin-auth" style="max-width: 500px; margin: 50px auto; padding: 20px;">
  <h2>관리자 로그인</h2>
  <p>GitHub 계정으로 로그인하여 포스트를 작성/수정할 수 있습니다.</p>
  <button id="github-login-btn" class="btn btn-primary btn-lg" onclick="window.githubAuth.login()">
    <i class="fab fa-github"></i> Login with GitHub
  </button>
  <div id="auth-status" class="mt-3" style="display: none;">
    <div class="alert alert-success">
      <strong>로그인됨:</strong> <span id="logged-in-user"></span>
      <button class="btn btn-sm btn-outline-secondary ml-2" onclick="window.githubAuth.logout()">로그아웃</button>
    </div>
  </div>
</div>

<div id="admin-editor" style="display: none;">
  <div class="mb-3">
    <button id="new-post-btn" class="btn btn-success">
      <i class="fas fa-plus"></i> 새 포스트 작성
    </button>
    <button id="load-posts-btn" class="btn btn-info">
      <i class="fas fa-list"></i> 포스트 목록
    </button>
    <div id="post-list" class="mt-3" style="display: none;"></div>
  </div>

  <div id="editor-container">
    <div class="row mb-3">
      <div class="col-md-6">
        <label for="post-title">제목:</label>
        <input type="text" id="post-title" class="form-control" placeholder="포스트 제목">
      </div>
      <div class="col-md-3">
        <label for="post-date">날짜:</label>
        <input type="date" id="post-date" class="form-control">
      </div>
      <div class="col-md-3">
        <label for="post-time">시간:</label>
        <input type="time" id="post-time" class="form-control" value="12:00">
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-6">
        <label for="post-categories">카테고리 (쉼표로 구분):</label>
        <input type="text" id="post-categories" class="form-control" placeholder="예: test, tutorial">
      </div>
      <div class="col-md-6">
        <label for="post-tags">태그 (쉼표로 구분):</label>
        <input type="text" id="post-tags" class="form-control" placeholder="예: side-project, python">
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-12">
        <label>
          <input type="checkbox" id="post-pin"> 고정 포스트
        </label>
        <label style="margin-left: 20px;">
          <input type="checkbox" id="post-math"> Math 지원
        </label>
        <label style="margin-left: 20px;">
          <input type="checkbox" id="post-mermaid"> Mermaid 지원
        </label>
        <label style="margin-left: 20px;">
          <input type="checkbox" id="post-comments" checked> 댓글 활성화
        </label>
      </div>
    </div>

    <div id="mde-editor"></div>

    <div class="mt-3">
      <button id="save-post-btn" class="btn btn-primary">
        <i class="fas fa-save"></i> 저장
      </button>
      <button id="preview-post-btn" class="btn btn-secondary">
        <i class="fas fa-eye"></i> 프리뷰
      </button>
      <span id="save-status" class="ml-3"></span>
    </div>
  </div>

  <div id="preview-container" class="mt-4" style="display: none;">
    <h3>프리뷰</h3>
    <div id="preview-content" class="post-content"></div>
  </div>
</div>

{% include github-auth-loader.html %}

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css">
<script src="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.js"></script>
<script src="/assets/js/admin.js"></script>
<script>
  // 인증 상태 확인 및 UI 업데이트
  document.addEventListener('DOMContentLoaded', () => {
    if (window.githubAuth && window.githubAuth.isAuthenticated()) {
      const user = window.githubAuth.getCurrentUser();
      if (user) {
        document.getElementById('auth-status').style.display = 'block';
        document.getElementById('logged-in-user').textContent = user.login;
        document.getElementById('admin-auth').querySelector('button').style.display = 'none';
        document.getElementById('admin-editor').style.display = 'block';
      }
    }
  });

  // 인증 성공 이벤트 리스너
  window.addEventListener('github-auth-success', () => {
    const user = window.githubAuth.getCurrentUser();
    if (user) {
      document.getElementById('auth-status').style.display = 'block';
      document.getElementById('logged-in-user').textContent = user.login;
      document.getElementById('admin-auth').querySelector('button').style.display = 'none';
      document.getElementById('admin-editor').style.display = 'block';
    }
  });

  // 로그아웃 이벤트 리스너
  window.addEventListener('github-auth-logout', () => {
    document.getElementById('auth-status').style.display = 'none';
    document.getElementById('admin-auth').querySelector('button').style.display = 'block';
    document.getElementById('admin-editor').style.display = 'none';
  });
</script>
<style>
  .EasyMDEContainer .CodeMirror {
    min-height: 500px;
  }
  .editor-toolbar {
    border-top: 1px solid #ddd;
    border-left: 1px solid #ddd;
    border-right: 1px solid #ddd;
  }
  .CodeMirror {
    border: 1px solid #ddd;
  }
  #post-list {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 4px;
  }
  .post-item {
    padding: 10px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
  }
  .post-item:hover {
    background-color: #f5f5f5;
  }
  .post-item:last-child {
    border-bottom: none;
  }
</style>
