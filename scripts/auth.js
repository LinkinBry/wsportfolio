/* ===================================================
   auth.js — Authentication (Login & Register)
=================================================== */

// ── Toast helper ─────────────────────────────────────
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon"></span><span class="toast-msg"></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector('.toast-msg').textContent = message;
  toast.querySelector('.toast-icon').innerHTML =
    type === 'success'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ── Field validation helpers ──────────────────────────
function setError(inputEl, errorEl, msg) {
  inputEl.classList.add('error');
  if (errorEl) { errorEl.textContent = msg; errorEl.classList.add('show'); }
}

function clearError(inputEl, errorEl) {
  inputEl.classList.remove('error');
  if (errorEl) { errorEl.classList.remove('show'); }
}

function validateEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

// ── Password toggle ───────────────────────────────────
function attachEyeToggle(toggleId, ...inputIds) {
  const btn = document.getElementById(toggleId);
  if (!btn) return;
  let visible = false;
  btn.addEventListener('click', () => {
    visible = !visible;
    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.type = visible ? 'text' : 'password';
    });
    btn.innerHTML = visible
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.94M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12M1 1l22 22"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });
}

// ── REGISTER ─────────────────────────────────────────
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  attachEyeToggle('toggleRegPass', 'regPassword', 'confirmPassword');

  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;

    const usernameEl   = document.getElementById('regUsername');
    const passwordEl   = document.getElementById('regPassword');
    const confirmEl    = document.getElementById('confirmPassword');
    const usernameErr  = document.getElementById('usernameErr');
    const passwordErr  = document.getElementById('passwordErr');
    const confirmErr   = document.getElementById('confirmErr');

    const username = usernameEl.value.trim();
    const password = passwordEl.value;
    const confirm  = confirmEl.value;

    // Clear previous
    [usernameEl, passwordEl, confirmEl].forEach((el, i) =>
      clearError(el, [usernameErr, passwordErr, confirmErr][i]));

    if (username.length < 3) {
      setError(usernameEl, usernameErr, 'Username must be at least 3 characters.');
      valid = false;
    } else {
      const users = JSON.parse(localStorage.getItem('users')) || [];
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        setError(usernameEl, usernameErr, 'That username is already taken.');
        valid = false;
      }
    }

    if (password.length < 6) {
      setError(passwordEl, passwordErr, 'Password must be at least 6 characters.');
      valid = false;
    }

    if (confirm !== password) {
      setError(confirmEl, confirmErr, 'Passwords do not match.');
      valid = false;
    }

    if (!valid) return;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));

    showToast('Account created! Redirecting to login…', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1600);
  });
}

// ── LOGIN ─────────────────────────────────────────────
const userForm = document.getElementById('userForm');
if (userForm) {
  attachEyeToggle('togglePass', 'password');

  // Prefill from Remember Me
  const saved = localStorage.getItem('rememberedUser');
  if (saved) {
    const usernameEl = document.getElementById('username');
    const remEl      = document.getElementById('rememberMe');
    if (usernameEl) usernameEl.value = saved;
    if (remEl)      remEl.checked = true;
  }

  userForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;

    const usernameEl  = document.getElementById('username');
    const passwordEl  = document.getElementById('password');
    const loginErr    = document.getElementById('loginErr');

    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    clearError(usernameEl, null);
    clearError(passwordEl, null);
    if (loginErr) loginErr.classList.remove('show');

    if (!username || !password) {
      if (loginErr) { loginErr.textContent = 'Please fill in all fields.'; loginErr.classList.add('show'); }
      valid = false;
    }

    if (!valid) return;

    const users   = JSON.parse(localStorage.getItem('users')) || [];
    const matched = users.find(u =>
      u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (matched) {
      localStorage.setItem('currentUser', matched.username);
      if (document.getElementById('rememberMe')?.checked) {
        localStorage.setItem('rememberedUser', matched.username);
      } else {
        localStorage.removeItem('rememberedUser');
      }
      showToast(`Welcome back, ${matched.username}!`, 'success');
      setTimeout(() => { window.location.href = 'homepage.html'; }, 1400);
    } else {
      if (loginErr) { loginErr.textContent = 'Invalid username or password.'; loginErr.classList.add('show'); }
      usernameEl.classList.add('error');
      passwordEl.classList.add('error');
      showToast('Login failed. Please check your credentials.', 'error');
    }
  });
}

// ── Google OAuth (One Tap) ────────────────────────────
function handleCredentialResponse(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const name    = (payload.name || payload.email || '').split(' ')[0];
    localStorage.setItem('currentUser', name);
    showToast(`Welcome, ${name}!`, 'success');
    setTimeout(() => { window.location.href = 'homepage.html'; }, 1400);
  } catch {
    showToast('Google sign-in failed.', 'error');
  }
}

window.onload = function () {
  if (typeof google !== 'undefined' && google.accounts) {
    const googleBtn = document.getElementById('googleLogin');
    google.accounts.id.initialize({
      client_id: '1092065868844-94i0do6rmmf5thhngthvkmplkaejnpg2.apps.googleusercontent.com',
      callback: handleCredentialResponse
    });
    if (googleBtn) {
      google.accounts.id.renderButton(googleBtn, { theme: 'outline', size: 'large' });
    }
  }
};