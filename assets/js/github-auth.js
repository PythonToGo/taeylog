/**
 * GitHub OAuth Authentication with PKCE
 * This script handles GitHub OAuth authentication for the blog admin features
 */

class GitHubAuth {
  constructor(config = {}) {
    // GitHub OAuth App 설정
    // config 객체에서 설정을 받거나 기본값 사용
    this.clientId = config.clientId || window.GITHUB_AUTH_CONFIG?.clientId || '';
    this.redirectUri = config.redirectUri || window.GITHUB_AUTH_CONFIG?.redirectUri || window.location.origin + '/admin';
    this.allowedUsername = config.allowedUsername || window.GITHUB_AUTH_CONFIG?.allowedUsername || '';
    this.scope = config.scope || 'repo';
    this.storageKey = 'github_auth_state';
    this.tokenKey = 'github_access_token';
    this.userKey = 'github_user';
    
    this.init();
  }

  init() {
    // URL에서 authorization code 확인
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      this.handleCallback(code, state);
    } else {
      this.checkAuthStatus();
    }
  }

  // PKCE: code_verifier와 code_challenge 생성
  generateCodeVerifier() {
    const array = new Uint32Array(56 / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  }

  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // GitHub OAuth 로그인 시작
  async login() {
    if (!this.clientId) {
      alert('GitHub OAuth App이 설정되지 않았습니다. _config.yml에서 github_auth.client_id를 설정해주세요.');
      return;
    }

    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateCodeVerifier(); // state도 랜덤 문자열 사용
    
    // state와 code_verifier를 localStorage에 저장
    localStorage.setItem(this.storageKey, JSON.stringify({
      state,
      codeVerifier
    }));

    // GitHub OAuth 인증 페이지로 리다이렉트
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', this.scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    
    window.location.href = authUrl.toString();
  }

  // OAuth callback 처리
  async handleCallback(code, state) {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      console.error('State not found in storage');
      return;
    }

    const { state: storedState, codeVerifier } = JSON.parse(stored);
    
    if (state !== storedState) {
      console.error('State mismatch');
      return;
    }

    // Authorization code를 access token으로 교환
    // 주의: 실제 프로덕션에서는 서버 사이드에서 처리해야 합니다
    // 여기서는 GitHub의 PKCE 지원을 활용하여 client_secret 없이 처리합니다
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.clientId,
          code: code,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Token exchange error:', data.error);
        alert('인증에 실패했습니다: ' + data.error_description);
        return;
      }

      if (data.access_token) {
        // Access token 저장
        localStorage.setItem(this.tokenKey, data.access_token);
        
        // 사용자 정보 가져오기
        await this.fetchUserInfo(data.access_token);
        
        // state 제거
        localStorage.removeItem(this.storageKey);
        
        // URL에서 code와 state 제거
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 인증 성공 후 페이지 새로고침 또는 리다이렉트
        this.onAuthSuccess();
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      alert('인증 처리 중 오류가 발생했습니다.');
    }
  }

  // GitHub API로 사용자 정보 가져오기
  async fetchUserInfo(accessToken) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        localStorage.setItem(this.userKey, JSON.stringify(user));
        return user;
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
    return null;
  }

  // 인증 상태 확인
  checkAuthStatus() {
    const token = localStorage.getItem(this.tokenKey);
    const user = localStorage.getItem(this.userKey);
    
    if (token && user) {
      const userData = JSON.parse(user);
      // 허용된 사용자인지 확인 (설정된 GitHub username과 비교)
      const allowedUsername = this.allowedUsername || window.GITHUB_AUTH_CONFIG?.allowedUsername || '';
      
      if (!allowedUsername || userData.login === allowedUsername) {
        this.onAuthSuccess();
        return true;
      } else {
        // 허용되지 않은 사용자
        this.logout();
        alert('이 블로그의 작성자만 접근할 수 있습니다.');
        return false;
      }
    }
    
    return false;
  }

  // 인증 성공 시 콜백
  onAuthSuccess() {
    // 인증된 사용자에게만 보이는 요소들 표시
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = '';
    });
    
    // 인증되지 않은 사용자에게만 보이는 요소들 숨김
    document.querySelectorAll('.auth-required').forEach(el => {
      el.style.display = 'none';
    });
    
    // 이벤트 발생
    window.dispatchEvent(new CustomEvent('github-auth-success'));
  }

  // 로그아웃
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.storageKey);
    
    // 모든 admin 요소 숨김
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = 'none';
    });
    
    // 인증 필요한 요소 표시
    document.querySelectorAll('.auth-required').forEach(el => {
      el.style.display = '';
    });
    
    window.dispatchEvent(new CustomEvent('github-auth-logout'));
  }

  // 현재 사용자 정보 가져오기
  getCurrentUser() {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  // 인증 여부 확인
  isAuthenticated() {
    return !!localStorage.getItem(this.tokenKey);
  }

  // GitHub API 요청 헤더 가져오기
  getAuthHeaders() {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return {};
    
    return {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
  }
}

// 전역 인스턴스는 github-auth-loader.html에서 생성됩니다
// 여기서는 클래스만 정의하고, 인스턴스는 설정이 로드된 후 생성됩니다
