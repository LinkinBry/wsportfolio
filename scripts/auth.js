/* ===================================================
   auth.js — Centered Auth · MyPortfolio
   Bryan Jay Domingo · 2026
=================================================== */
'use strict';

/* ── Storage helpers ──────────────────────────────── */
const getUsers   = ()     => JSON.parse(localStorage.getItem('portfolio_users') || '[]');
const saveUsers  = (u)    => localStorage.setItem('portfolio_users', JSON.stringify(u));
const setSession = (name) => localStorage.setItem('portfolio_current', name);

/* ── Toast ────────────────────────────────────────── */
function toast(msg, type = 'inf', ms = 3400) {
  const rack = document.getElementById('toastRack');
  if (!rack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-ic"></span><span>${msg}</span>`;
  rack.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, ms);
}

/* ── Field state helpers ──────────────────────────── */
function setOk(id, msg = '') {
  const f = document.getElementById(id);
  if (!f) return;
  f.classList.remove('is-err');
  f.classList.add('is-ok');
  const m = f.querySelector('.ff-msg');
  if (m) m.textContent = msg;
}
function setErr(id, msg) {
  const f = document.getElementById(id);
  if (!f) return;
  f.classList.remove('is-ok');
  f.classList.add('is-err');
  const m = f.querySelector('.ff-msg');
  if (m) m.textContent = msg;
}
function clrField(id) {
  const f = document.getElementById(id);
  if (!f) return;
  f.classList.remove('is-ok', 'is-err');
  const m = f.querySelector('.ff-msg');
  if (m) m.textContent = '';
}

function showBanner(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function hideBanner(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

/* ── View switching ───────────────────────────────── */
function switchTo(panel) {
  const login = document.getElementById('loginView');
  const reg   = document.getElementById('registerView');
  if (!login || !reg) return;

  if (panel === 'register') {
    login.classList.remove('active');
    reg.classList.add('active');
    // re-trigger animation
    reg.style.animation = 'none';
    requestAnimationFrame(() => { reg.style.animation = ''; });
  } else {
    reg.classList.remove('active');
    login.classList.add('active');
    login.style.animation = 'none';
    requestAnimationFrame(() => { login.style.animation = ''; });
    clearLogin();
  }
}

document.querySelectorAll('.av-switch').forEach(btn => {
  btn.addEventListener('click', () => switchTo(btn.dataset.to));
});

// Handle redirect from register.html
if (sessionStorage.getItem('auth_panel') === 'register') {
  sessionStorage.removeItem('auth_panel');
  switchTo('register');
}

/* ── Eye toggles ──────────────────────────────────── */
document.querySelectorAll('.ff-eye').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp = document.getElementById(btn.dataset.for);
    if (!inp) return;
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    btn.querySelector('.i-show').style.display = show ? 'none' : '';
    btn.querySelector('.i-hide').style.display = show ? ''     : 'none';
  });
});

/* ── Password strength ────────────────────────────── */
const RULES = {
  len:   v => v.length >= 8,
  upper: v => /[A-Z]/.test(v),
  num:   v => /[0-9]/.test(v),
  sym:   v => /[^A-Za-z0-9]/.test(v),
};

function updateStrength(val) {
  const segs = [0,1,2,3].map(i => document.getElementById(`seg${i}`));
  const lbl  = document.getElementById('pwLbl');
  const pills = {
    len: document.getElementById('req-len'),
    up:  document.getElementById('req-up'),
    num: document.getElementById('req-num'),
    sym: document.getElementById('req-sym'),
  };

  const score = Object.values(RULES).filter(fn => fn(val)).length;

  segs.forEach(s => { if (s) s.className = 'pw-seg'; });

  const cls    = ['','s1','s2','s3','s4'];
  const labels = ['','Weak','Fair','Good','Strong'];
  const colors = ['','#f87171','#fbbf24','#60a5fa','#34d399'];

  for (let i = 0; i < score; i++) {
    if (segs[i]) segs[i].classList.add(cls[score]);
  }
  if (lbl) {
    lbl.textContent  = val ? (labels[score] || '') : '';
    lbl.style.color  = colors[score] || 'var(--text-dim)';
  }

  // Pills
  if (pills.len) pills.len.classList.toggle('met', RULES.len(val));
  if (pills.up)  pills.up .classList.toggle('met', RULES.upper(val));
  if (pills.num) pills.num.classList.toggle('met', RULES.num(val));
  if (pills.sym) pills.sym.classList.toggle('met', RULES.sym(val));
}

const rPassEl = document.getElementById('r-pass');
if (rPassEl) {
  rPassEl.addEventListener('input', () => {
    updateStrength(rPassEl.value);
    const cfm = document.getElementById('r-confirm');
    if (cfm?.value) validateConfirm();
  });
}

/* ── Validation helpers ───────────────────────────── */
function validateUsername(v) {
  if (!v)                          return 'Username is required.';
  if (v.length < 3)                return 'At least 3 characters.';
  if (v.length > 20)               return 'Max 20 characters.';
  if (!/^[A-Za-z0-9_]+$/.test(v)) return 'Letters, numbers & underscores only.';
  const taken = getUsers().some(u => u.username.toLowerCase() === v.toLowerCase());
  if (taken)                       return 'Username already taken.';
  return null;
}
function validateEmail(v) {
  if (!v) return null; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email.';
}
function validatePw(v) {
  if (!v)              return 'Password is required.';
  if (!RULES.len(v))   return 'At least 8 characters required.';
  if (!RULES.upper(v)) return 'Add an uppercase letter (A–Z).';
  if (!RULES.num(v))   return 'Add a number (0–9).';
  if (!RULES.sym(v))   return 'Add a special character (#$!…).';
  return null;
}
function validateConfirm() {
  const pw  = document.getElementById('r-pass')?.value    || '';
  const cfm = document.getElementById('r-confirm')?.value || '';
  if (!cfm)      { setErr('fr-confirm', 'Please confirm your password.'); return false; }
  if (cfm !== pw){ setErr('fr-confirm', 'Passwords do not match.');        return false; }
  setOk('fr-confirm', 'Passwords match ✓');
  return true;
}

/* ── Live blur validation (register) ─────────────── */
(function attachBlur() {
  const rUser  = document.getElementById('r-user');
  const rEmail = document.getElementById('r-email');
  const rPass  = document.getElementById('r-pass');
  const rCfm   = document.getElementById('r-confirm');

  rUser?.addEventListener('blur', () => {
    const e = validateUsername(rUser.value.trim());
    e ? setErr('fr-user', e) : setOk('fr-user');
  });
  rUser?.addEventListener('input', () => clrField('fr-user'));

  rEmail?.addEventListener('blur', () => {
    const v = rEmail.value.trim();
    if (!v) { clrField('fr-email'); return; }
    const e = validateEmail(v);
    e ? setErr('fr-email', e) : setOk('fr-email');
  });
  rEmail?.addEventListener('input', () => clrField('fr-email'));

  rPass?.addEventListener('blur', () => {
    const e = validatePw(rPass.value);
    e ? setErr('fr-pass', e) : setOk('fr-pass');
  });

  rCfm?.addEventListener('blur',  validateConfirm);
  rCfm?.addEventListener('input', () => clrField('fr-confirm'));
})();

/* ── Submit loader ────────────────────────────────── */
function setLoading(btnId, on) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = on;
  btn.classList.toggle('loading', on);
}

/* ════════════════════════════════════════════════════
   REGISTER SUBMIT
════════════════════════════════════════════════════ */
document.getElementById('registerForm')?.addEventListener('submit', e => {
  e.preventDefault();
  hideBanner('registerErr');

  const username = document.getElementById('r-user')?.value.trim()  || '';
  const email    = document.getElementById('r-email')?.value.trim() || '';
  const password = document.getElementById('r-pass')?.value         || '';
  const confirm  = document.getElementById('r-confirm')?.value      || '';

  let valid = true;

  const uErr = validateUsername(username);
  if (uErr) { setErr('fr-user', uErr); valid = false; } else setOk('fr-user');

  if (email) {
    const eErr = validateEmail(email);
    if (eErr) { setErr('fr-email', eErr); valid = false; } else setOk('fr-email');
  }

  const pErr = validatePw(password);
  if (pErr) { setErr('fr-pass', pErr); valid = false; } else setOk('fr-pass');

  if (!validateConfirm()) valid = false;

  if (!valid) return;

  setLoading('registerBtn', true);
  setTimeout(() => {
    const users = getUsers();
    users.push({ username, email, password });
    saveUsers(users);
    setLoading('registerBtn', false);
    toast(`Account created! Welcome, ${username} 🎉`, 'ok', 3000);
    setTimeout(() => switchTo('login'), 1100);
  }, 900);
});

/* ════════════════════════════════════════════════════
   LOGIN SUBMIT
════════════════════════════════════════════════════ */
function clearLogin() {
  ['fl-user','fl-pass'].forEach(clrField);
  hideBanner('loginErr');
}

// Prefill remembered username
const remembered = localStorage.getItem('portfolio_remembered');
const lUserEl    = document.getElementById('l-user');
const remEl      = document.getElementById('rememberMe');
if (remembered && lUserEl) {
  lUserEl.value = remembered;
  if (remEl) remEl.checked = true;
}

document.getElementById('loginForm')?.addEventListener('submit', e => {
  e.preventDefault();
  hideBanner('loginErr');

  const username = document.getElementById('l-user')?.value.trim() || '';
  const password = document.getElementById('l-pass')?.value        || '';

  let valid = true;
  if (!username) { setErr('fl-user', 'Username is required.'); valid = false; } else clrField('fl-user');
  if (!password) { setErr('fl-pass', 'Password is required.'); valid = false; } else clrField('fl-pass');
  if (!valid) return;

  setLoading('loginBtn', true);
  setTimeout(() => {
    const matched = getUsers().find(u =>
      u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    setLoading('loginBtn', false);

    if (matched) {
      setSession(matched.username);
      if (remEl?.checked) {
        localStorage.setItem('portfolio_remembered', matched.username);
      } else {
        localStorage.removeItem('portfolio_remembered');
      }
      setOk('fl-user'); setOk('fl-pass');
      toast(`Welcome back, ${matched.username}!`, 'ok', 2400);
      setTimeout(() => { window.location.href = 'homepage.html'; }, 1100);
    } else {
      setErr('fl-user', ' ');
      setErr('fl-pass', 'Invalid username or password.');
      showBanner('loginErr', 'Incorrect credentials. Please try again.');
      toast('Login failed. Check your credentials.', 'err');
    }
  }, 800);
});

/* ── Google OAuth ─────────────────────────────────── */
function handleCredentialResponse(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const name    = (payload.name || payload.email || 'User').split(' ')[0];
    setSession(name);
    toast(`Welcome, ${name}! Signed in with Google.`, 'ok');
    setTimeout(() => { window.location.href = 'homepage.html'; }, 1200);
  } catch {
    toast('Google sign-in failed. Try again.', 'err');
  }
}

window.onload = function () {
  if (typeof google !== 'undefined' && google.accounts) {
    const btn = document.getElementById('googleLoginBtn');
    google.accounts.id.initialize({
      client_id: '1092065868844-94i0do6rmmf5thhngthvkmplkaejnpg2.apps.googleusercontent.com',
      callback: handleCredentialResponse,
    });
    if (btn) google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large' });
  }
};
