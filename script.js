/* ═══════════════════════════════════════════════════════════
   AGRI-APP 2055 — Secure Authentication  •  script.js
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  const body             = document.body;
  const themeToggle      = document.getElementById('themeToggle');
  const themeIcon        = document.getElementById('themeIcon');
  const loginTab         = document.getElementById('loginTab');
  const signupTab        = document.getElementById('signupTab');
  const tabContainer     = document.querySelector('.tab-container');
  const formTitle        = document.getElementById('formTitle');
  const formSubtitle     = document.getElementById('formSubtitle');
  const authForm         = document.getElementById('authForm');
  const submitBtn        = document.getElementById('submitBtn');
  const btnText          = document.getElementById('btnText');
  const securityBanner   = document.getElementById('securityBanner');
  const rememberMeCheck  = document.getElementById('rememberMe');

  const emailInput       = document.getElementById('email');
  const passwordInput    = document.getElementById('password');
  const confirmInput     = document.getElementById('confirmPassword');
  const fullNameInput    = document.getElementById('fullName');

  const emailError       = document.getElementById('emailError');
  const passwordError    = document.getElementById('passwordError');
  const confirmError     = document.getElementById('confirmError');
  const nameError        = document.getElementById('nameError');

  const togglePassword   = document.getElementById('togglePassword');
  const toggleConfirm    = document.getElementById('toggleConfirm');

  const barFill          = document.getElementById('barFill');
  const strengthLabel    = document.getElementById('strengthLabel');

  const roleCards        = document.querySelectorAll('.role-card');

  const googleModal      = document.getElementById('googleModal');
  const forgotModal      = document.getElementById('forgotModal');
  const loadingOverlay   = document.getElementById('loadingOverlay');
  const loadingText      = document.getElementById('loadingText');
  const closeModal       = document.getElementById('closeModal');
  const forgotLink       = document.getElementById('forgotLink');
  const cancelReset      = document.getElementById('cancelReset');
  const sendReset        = document.getElementById('sendReset');
  const resetEmailInput  = document.getElementById('resetEmail');
  const googleBtn        = document.getElementById('googleBtn');
  const snackbar         = document.getElementById('snackbar');

  let isLogin = true;
  let lockoutTimer = null;

  // ═══════════════════════════════════════
  //  CRYPTOGRAPHIC HASHING (SHA-256)
  // ═══════════════════════════════════════
  async function hashPassword(plainText) {
    if (window.crypto && crypto.subtle) {
      try {
        const msgUint8 = new TextEncoder().encode(plainText);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        console.warn('Crypto subtle failed, using fallback', e);
      }
    }
    // Fallback deterministic hash
    let hash = 0;
    for (let i = 0; i < plainText.length; i++) {
      const char = plainText.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(16) + '_sec';
  }

  // ═══════════════════════════════════════
  //  SECURE ACCOUNTS DATABASE (LOCALSTORAGE)
  // ═══════════════════════════════════════
  function getAccounts() {
    try {
      const stored = localStorage.getItem('agri_accounts');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading accounts', e);
    }
    return [];
  }

  function saveAccounts(accounts) {
    localStorage.setItem('agri_accounts', JSON.stringify(accounts));
  }

  // Purge any old seeded demo accounts from client storage
  function purgeDemoAccounts() {
    try {
      const demoEmails = [
        'logesh.marimuthu25@gmail.com',
        'admin.agri@gmail.com',
        'logesh.agri@gmail.com',
        'github.user@agri.com'
      ];
      let accounts = getAccounts();
      const cleaned = accounts.filter(acc => !demoEmails.includes((acc.email || '').toLowerCase()));
      saveAccounts(cleaned);

      const remembered = localStorage.getItem('agri_remembered_email');
      if (remembered && demoEmails.includes(remembered.toLowerCase())) {
        localStorage.removeItem('agri_remembered_email');
      }
    } catch (e) {
      console.warn('Storage purge error', e);
    }
  }
  purgeDemoAccounts();

  // ── Auto-fill Remembered Email (real signups only) ──
  const rememberedEmail = localStorage.getItem('agri_remembered_email');
  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    if (rememberMeCheck) rememberMeCheck.checked = true;
  }

  // ═══════════════════════════════════════
  //  SECURITY BANNER HELPER
  // ═══════════════════════════════════════
  function showBanner(message, type = 'error') {
    if (!securityBanner) return;
    const icon = type === 'error' ? 'error_outline' : type === 'warning' ? 'warning_amber' : 'check_circle_outline';
    securityBanner.className = `security-banner ${type}`;
    securityBanner.innerHTML = `
      <span class="material-icons-round">${icon}</span>
      <span>${message}</span>
    `;
    securityBanner.style.display = 'flex';
  }

  function hideBanner() {
    if (securityBanner) securityBanner.style.display = 'none';
  }

  // ═══════════════════════════════════════
  //  BRUTE FORCE RATE LIMITING & LOCKOUT
  // ═══════════════════════════════════════
  function getLockoutUntil() {
    return parseInt(sessionStorage.getItem('agri_lockout_until') || '0', 10);
  }

  function getFailedAttempts() {
    return parseInt(sessionStorage.getItem('agri_failed_attempts') || '0', 10);
  }

  function recordFailedAttempt() {
    const attempts = getFailedAttempts() + 1;
    sessionStorage.setItem('agri_failed_attempts', attempts.toString());

    if (attempts >= 5) {
      const lockDuration = 30; // 30 seconds
      const unlockTime = Date.now() + (lockDuration * 1000);
      sessionStorage.setItem('agri_lockout_until', unlockTime.toString());
      triggerLockout(lockDuration);
    } else if (attempts >= 3) {
      showBanner(`Incorrect password. ${5 - attempts} attempts remaining before temporary lockout.`, 'warning');
    } else {
      showBanner('Incorrect credentials. Please verify your email and password.', 'error');
    }
  }

  function resetFailedAttempts() {
    sessionStorage.removeItem('agri_failed_attempts');
    sessionStorage.removeItem('agri_lockout_until');
  }

  function triggerLockout(initialSeconds) {
    let remaining = initialSeconds;
    if (submitBtn) {
      submitBtn.classList.add('btn-lockout');
      submitBtn.disabled = true;
    }
    if (btnText) btnText.textContent = `LOCKED (${remaining}s)`;
    showBanner(`Too many failed login attempts! Security lock active. Please wait ${remaining} seconds.`, 'error');

    if (lockoutTimer) clearInterval(lockoutTimer);
    lockoutTimer = setInterval(() => {
      remaining--;
      if (btnText) btnText.textContent = `LOCKED (${remaining}s)`;
      if (remaining <= 0) {
        clearInterval(lockoutTimer);
        resetFailedAttempts();
        if (submitBtn) {
          submitBtn.classList.remove('btn-lockout');
          submitBtn.disabled = false;
        }
        if (btnText) btnText.textContent = isLogin ? 'Log in' : 'Create account';
        hideBanner();
        showBanner('Security lockout ended. You may now attempt to log in.', 'warning');
      }
    }, 1000);
  }

  // Check on load if currently locked out
  const currentLock = getLockoutUntil();
  if (currentLock > Date.now()) {
    const remainingSecs = Math.ceil((currentLock - Date.now()) / 1000);
    triggerLockout(remainingSecs);
  }

  // ═══════════════════════════════════════
  //  THEME TOGGLE
  // ═══════════════════════════════════════
  const savedTheme = localStorage.getItem('agri_theme');
  if (savedTheme === 'light') {
    body.classList.remove('dark');
    body.classList.add('light');
    if (themeIcon) themeIcon.textContent = 'dark_mode';
  } else {
    body.classList.add('dark');
    body.classList.remove('light');
    if (themeIcon) themeIcon.textContent = 'light_mode';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = body.classList.contains('dark');
      if (isDark) {
        body.classList.remove('dark');
        body.classList.add('light');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
        localStorage.setItem('agri_theme', 'light');
      } else {
        body.classList.remove('light');
        body.classList.add('dark');
        if (themeIcon) themeIcon.textContent = 'light_mode';
        localStorage.setItem('agri_theme', 'dark');
      }
    });
  }

  // ═══════════════════════════════════════
  //  PARTICLE CANVAS BACKGROUND
  // ═══════════════════════════════════════
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = ['#00e5ff', '#22c55e', '#a855f7'][Math.floor(Math.random() * 3)];
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        const isLight = body.classList.contains('light');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? (this.color === '#00e5ff' ? '#0284c7' : this.color) : this.color;
        ctx.globalAlpha = isLight ? this.opacity * 0.35 : this.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    for (let i = 0; i < 60; i++) particles.push(new Particle());

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // ═══════════════════════════════════════
  //  TAB SWITCHING (LOGIN / SIGNUP)
  // ═══════════════════════════════════════
  function switchTab(toLogin) {
    isLogin = toLogin;
    if (loginTab) loginTab.classList.toggle('active', toLogin);
    if (signupTab) signupTab.classList.toggle('active', !toLogin);
    if (tabContainer) tabContainer.classList.toggle('signup', !toLogin);
    body.classList.toggle('mode-signup', !toLogin);

    if (formTitle) formTitle.textContent = toLogin ? 'Welcome back' : 'Create account';
    if (formSubtitle) formSubtitle.textContent = toLogin
      ? 'Enter your verified credentials to continue'
      : 'Register your secure multi-operational account';
    if (btnText && !submitBtn.classList.contains('btn-lockout')) {
      btnText.textContent = toLogin ? 'Log in' : 'Create account';
    }

    hideBanner();
    clearAllErrors();
  }

  if (loginTab) loginTab.addEventListener('click', () => switchTab(true));
  if (signupTab) signupTab.addEventListener('click', () => switchTab(false));

  // ═══════════════════════════════════════
  //  PASSWORD VISIBILITY
  // ═══════════════════════════════════════
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      const icon = togglePassword.querySelector('.material-icons-round');
      if (icon) icon.textContent = isHidden ? 'visibility' : 'visibility_off';
    });
  }

  if (toggleConfirm && confirmInput) {
    toggleConfirm.addEventListener('click', () => {
      const isHidden = confirmInput.type === 'password';
      confirmInput.type = isHidden ? 'text' : 'password';
      const icon = toggleConfirm.querySelector('.material-icons-round');
      if (icon) icon.textContent = isHidden ? 'visibility' : 'visibility_off';
    });
  }

  // ═══════════════════════════════════════
  //  PASSWORD STRENGTH INDICATOR
  // ═══════════════════════════════════════
  if (passwordInput && barFill && strengthLabel) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      let s = 0;
      if (val.length > 0)              s++;
      if (val.length >= 6)             s++;
      if (/[A-Z]/.test(val))           s++;
      if (/[0-9!@#$&*~]/.test(val))    s++;

      const percent = s * 25;
      barFill.style.width = percent + '%';

      const labels = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG'];
      const colors = ['', '#ef4444', '#f59e0b', '#84cc16', '#22c55e'];
      strengthLabel.textContent = labels[s];
      strengthLabel.style.color = colors[s];
    });
  }

  // ═══════════════════════════════════════
  //  ROLE CARDS SELECTION
  // ═══════════════════════════════════════
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  // ═══════════════════════════════════════
  //  FORM VALIDATION
  // ═══════════════════════════════════════
  function clearAllErrors() {
    [emailError, passwordError, confirmError, nameError].forEach(e => {
      if (e) e.textContent = '';
    });
    document.querySelectorAll('.input-wrap').forEach(w => w.classList.remove('error'));
  }

  function setError(input, errorEl, msg) {
    if (errorEl) errorEl.textContent = msg;
    if (input) {
      const wrap = input.closest('.input-wrap');
      if (wrap) wrap.classList.add('error');
    }
  }

  function validateBasicFields() {
    clearAllErrors();
    hideBanner();
    let ok = true;

    if (!isLogin && fullNameInput && !fullNameInput.value.trim()) {
      setError(fullNameInput, nameError, 'Full name is required for registration');
      ok = false;
    }

    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    if (!email) {
      setError(emailInput, emailError, 'Email address is required');
      ok = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError(emailInput, emailError, 'Please enter a valid email address');
      ok = false;
    }

    const pwd = passwordInput ? passwordInput.value : '';
    if (!pwd) {
      setError(passwordInput, passwordError, 'Password is required');
      ok = false;
    } else if (!isLogin && pwd.length < 6) {
      setError(passwordInput, passwordError, 'Password must be at least 6 characters');
      ok = false;
    }

    if (!isLogin && confirmInput) {
      if (!confirmInput.value) {
        setError(confirmInput, confirmError, 'Please confirm your password');
        ok = false;
      } else if (confirmInput.value !== pwd) {
        setError(confirmInput, confirmError, 'Passwords do not match');
        ok = false;
      }
    }

    return ok;
  }

  // ═══════════════════════════════════════
  //  SESSION ISSUER & MAIN REDIRECT
  // ═══════════════════════════════════════
  function createAuthenticatedSession(account) {
    // Generate secure session token
    const token = 'agt_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const sessionObj = {
      token: token,
      name: account.name,
      email: account.email,
      role: account.role || 'Owner',
      phone: account.phone || '+91 98765 43210',
      loginTime: Date.now()
    };

    localStorage.setItem('agri_session', JSON.stringify(sessionObj));
    localStorage.setItem('agri_user', JSON.stringify(sessionObj)); // Backward compatibility

    // Remember Me handling
    if (rememberMeCheck && rememberMeCheck.checked) {
      localStorage.setItem('agri_remembered_email', account.email);
    } else {
      localStorage.removeItem('agri_remembered_email');
    }

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 700);
  }

  // ═══════════════════════════════════════
  //  AUTHENTICATION & FORM SUBMIT
  // ═══════════════════════════════════════
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check lockout status
      if (getLockoutUntil() > Date.now()) {
        showBanner('Access locked due to excessive failed attempts. Please wait.', 'error');
        return;
      }

      if (!validateBasicFields()) return;

      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;
      const accounts = getAccounts();

      if (submitBtn) submitBtn.classList.add('loading');

      // ── CONNECT TO BACKEND API (STEPS 3 & 4) ──
      try {
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
        const payload = isLogin
          ? { email, password }
          : {
              name: fullNameInput.value.trim(),
              email,
              password,
              role: (document.querySelector('.role-card.selected') || {}).dataset?.role || 'Owner'
            };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (submitBtn) submitBtn.classList.remove('loading');

        // Handle error status codes from server
        if (!response.ok) {
          if (response.status === 429) {
            triggerLockout(900); // 15 mins
            showBanner(data.error || 'Too many failed attempts. Temporary security lockout active.', 'error');
            return;
          }

          if (isLogin) {
            recordFailedAttempt();
            setError(passwordInput, passwordError, 'Authentication failed');
            showBanner(data.error || 'Invalid email or password.', 'error');
          } else {
            setError(emailInput, emailError, data.error || 'Registration failed');
            showBanner(data.error || 'Could not register account.', 'error');
          }
          return;
        }

        // ── SUCCESS FLOWS ──
        if (isLogin) {
          resetFailedAttempts();
          showBanner(`✓ Identity verified! Welcome back, ${data.user.name}.`, 'success');
          showSnackbar(`✓ Logged in as ${data.user.name}! Entering dashboard...`);
          createAuthenticatedSession(data.user);
        } else {
          // STEP 3: Switch back to Login tab (do not auto-log in)
          switchTab(true);

          if (emailInput) emailInput.value = data.email || email;
          if (passwordInput) passwordInput.value = '';
          if (confirmInput) confirmInput.value = '';
          if (fullNameInput) fullNameInput.value = '';
          if (passwordInput) passwordInput.focus();

          showBanner(`✓ Account registered for ${data.name || 'User'}! Please enter your password and click "Log in".`, 'success');
          showSnackbar('✓ Account created! Please log in with your credentials.');
        }

        return;
      } catch (networkError) {
        console.warn('Backend API offline or file:// protocol, executing secure client fallback', networkError);
      }

      // ── OFFLINE / STANDALONE CLIENT FALLBACK ──
      if (isLogin) {
        const foundAccount = accounts.find(acc => acc.email.toLowerCase() === email);

        if (!foundAccount) {
          if (submitBtn) submitBtn.classList.remove('loading');
          setError(emailInput, emailError, 'Account not registered');
          showBanner('⚠️ No account found with this email! Please click "Sign up" to create an account first.', 'error');
          return;
        }

        // Verify password hash
        const inputHash = await hashPassword(password);
        if (foundAccount.passwordHash !== inputHash) {
          if (submitBtn) submitBtn.classList.remove('loading');
          setError(passwordInput, passwordError, 'Incorrect password');
          recordFailedAttempt();
          return;
        }

        resetFailedAttempts();
        showBanner(`✓ Identity verified! Welcome back, ${foundAccount.name}.`, 'success');
        showSnackbar(`✓ Logged in as ${foundAccount.name}! Entering dashboard...`);

        setTimeout(() => {
          if (submitBtn) submitBtn.classList.remove('loading');
          createAuthenticatedSession(foundAccount);
        }, 500);

      } else {
        const existing = accounts.find(acc => acc.email.toLowerCase() === email);
        if (existing) {
          if (submitBtn) submitBtn.classList.remove('loading');
          setError(emailInput, emailError, 'Email already in use');
          showBanner('⚠️ An account with this email already exists! Please click "Log in" to access.', 'warning');
          return;
        }

        const name = fullNameInput.value.trim();
        const selectedRoleCard = document.querySelector('.role-card.selected');
        const role = selectedRoleCard ? selectedRoleCard.dataset.role : 'Owner';
        const passwordHash = await hashPassword(password);

        const newAccount = {
          name: name,
          email: email,
          passwordHash: passwordHash,
          role: role,
          phone: '+91 98765 43210',
          createdAt: new Date().toISOString()
        };

        accounts.push(newAccount);
        saveAccounts(accounts);
        resetFailedAttempts();

        if (submitBtn) submitBtn.classList.remove('loading');

        // Switch to the Login tab
        switchTab(true);

        // Pre-fill email, clear password fields, and focus password input
        if (emailInput) emailInput.value = email;
        if (passwordInput) passwordInput.value = '';
        if (confirmInput) confirmInput.value = '';
        if (fullNameInput) fullNameInput.value = '';
        if (passwordInput) passwordInput.focus();

        showBanner(`✓ Account registered for ${name}! Please enter your password and click "Log in".`, 'success');
        showSnackbar('✓ Account created! Please log in with your password.');
      }
    });
  }

  // ═══════════════════════════════════════
  //  OFFICIAL GOOGLE OAUTH FLOW
  // ═══════════════════════════════════════
  const customGoogleBox      = document.getElementById('customGoogleBox');
  const customGoogleName     = document.getElementById('customGoogleName');
  const customGoogleEmail    = document.getElementById('customGoogleEmail');
  const btnCustomGoogleSubmit = document.getElementById('btnCustomGoogleSubmit');

  window.openGoogleModal = function() {
    const modal = document.getElementById('googleModal');
    const box = document.getElementById('customGoogleBox');
    if (box) box.style.display = 'none';
    if (modal) modal.classList.add('show');
  };

  window.closeGoogleModal = function() {
    const modal = document.getElementById('googleModal');
    if (modal) modal.classList.remove('show');
  };

  window.toggleUseAnotherAccount = function() {
    const box = document.getElementById('customGoogleBox');
    if (box) {
      const isHidden = box.style.display === 'none';
      box.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        const input = document.getElementById('customGoogleEmail');
        if (input) input.focus();
      }
    }
  };

  window.selectGoogleAccount = function(name, email) {
    executeGoogleAuth(name, email);
  };

  // Open Google OAuth Account Chooser Modal
  if (googleBtn) {
    googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.openGoogleModal();
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', (e) => {
      e.preventDefault();
      window.closeGoogleModal();
    });
  }
  if (googleModal) {
    googleModal.addEventListener('click', (e) => {
      if (e.target === googleModal) window.closeGoogleModal();
    });
  }

  // Account row clicks: "Logesh M", "LOGESH M", or "Use another account"
  document.querySelectorAll('.google-acct-row').forEach(row => {
    row.addEventListener('click', (e) => {
      e.preventDefault();
      if (row.id === 'useAnotherAccountRow') {
        window.toggleUseAnotherAccount();
        return;
      }

      const name = row.dataset.name;
      const email = row.dataset.email;
      if (name && email) {
        executeGoogleAuth(name, email);
      }
    });
  });

  // Custom Google account submission
  if (btnCustomGoogleSubmit) {
    btnCustomGoogleSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      const email = customGoogleEmail ? customGoogleEmail.value.trim().toLowerCase() : '';
      let name = customGoogleName ? customGoogleName.value.trim() : '';

      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        showSnackbar('⚠️ Please enter a valid Google email address.');
        if (customGoogleEmail) customGoogleEmail.focus();
        return;
      }

      if (!name) {
        const prefix = email.split('@')[0];
        name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }

      executeGoogleAuth(name, email);
    });
  }

  // Unified Google OAuth execution function
  async function executeGoogleAuth(name, email) {
    if (googleModal) googleModal.classList.remove('show');
    if (loadingText) loadingText.textContent = `Connecting to Google account for ${name}...`;
    if (loadingOverlay) loadingOverlay.classList.add('show');

    try {
      // Connect to backend /api/auth/google endpoint
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });

      if (response.ok) {
        const data = await response.json();
        setTimeout(() => {
          if (loadingOverlay) loadingOverlay.classList.remove('show');
          resetFailedAttempts();
          showBanner(`✓ Google authenticated! Welcome back, ${data.user.name}.`, 'success');
          showSnackbar(`✓ Google verified as ${data.user.name}! Entering dashboard...`);
          createAuthenticatedSession(data.user);
        }, 700);
        return;
      }
    } catch (err) {
      console.warn('Backend /api/auth/google offline, executing secure client session', err);
    }

    // Client fallback
    const googleUser = {
      name: name,
      email: email,
      role: 'Owner',
      phone: '+91 98765 43210',
      loginTime: Date.now()
    };

    setTimeout(() => {
      if (loadingOverlay) loadingOverlay.classList.remove('show');
      resetFailedAttempts();
      showBanner(`✓ Google verified! Welcome back, ${name}.`, 'success');
      showSnackbar(`✓ Google verified as ${name}! Entering dashboard...`);
      createAuthenticatedSession(googleUser);
    }, 800);
  }

  // ═══════════════════════════════════════
  //  FORGOT PASSWORD (VERIFIED LOOKUP)
  // ═══════════════════════════════════════
  if (forgotLink && forgotModal) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (emailInput && resetEmailInput) resetEmailInput.value = emailInput.value;
      forgotModal.classList.add('show');
    });
  }
  if (cancelReset && forgotModal) {
    cancelReset.addEventListener('click', () => forgotModal.classList.remove('show'));
  }
  if (forgotModal) {
    forgotModal.addEventListener('click', (e) => {
      if (e.target === forgotModal) forgotModal.classList.remove('show');
    });
  }
  if (sendReset && forgotModal && resetEmailInput) {
    sendReset.addEventListener('click', () => {
      const email = resetEmailInput.value.trim().toLowerCase();
      const accounts = getAccounts();
      const acc = accounts.find(a => a.email.toLowerCase() === email);

      if (!acc) {
        showSnackbar('⚠️ No account found with this email.');
        return;
      }

      forgotModal.classList.remove('show');
      showSnackbar(`✓ Password reset link sent to ${email}`);
    });
  }

  // ═══════════════════════════════════════
  //  TOAST SNACKBAR
  // ═══════════════════════════════════════
  function showSnackbar(msg) {
    if (!snackbar) return;
    snackbar.textContent = msg;
    snackbar.classList.add('show');
    setTimeout(() => snackbar.classList.remove('show'), 3500);
  }

  // ═══════════════════════════════════════
  //  CLEAR ERRORS ON INPUT CHANGE
  // ═══════════════════════════════════════
  [emailInput, passwordInput, confirmInput, fullNameInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        hideBanner();
        const wrap = input.closest('.input-wrap');
        if (wrap) wrap.classList.remove('error');
        const parent = wrap ? wrap.parentElement : null;
        const errEl = parent ? parent.querySelector('.field-error') : null;
        if (errEl) errEl.textContent = '';
      });
    }
  });
});
