/* ===================================================
   script.js — Main Portfolio Script
   Features: auth guard, theme, projects JSON, contact
             form validation, accordion, greeting
=================================================== */

/* ── Auth Guard ──────────────────────────────────────
   Redirects to login if no session found.
   Exempt pages: index.html, register.html            */
(function authGuard() {
  const exempt = ['index.html', 'register.html', ''];
  const page   = window.location.pathname.split('/').pop();
  if (!exempt.includes(page) && !localStorage.getItem('currentUser')) {
    window.location.replace('index.html');
  }
})();

/* ── DOM Ready ───────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {

  // ── Theme Toggle ─────────────────────────────────
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    const saved = localStorage.getItem('theme');
    if (saved === 'light-mode') document.body.classList.add('light-mode');

    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const current = document.body.classList.contains('light-mode') ? 'light-mode' : '';
      localStorage.setItem('theme', current);
    });
  }

  // ── Feather icons ─────────────────────────────────
  if (typeof feather !== 'undefined') feather.replace();

  // ── Greeting label ────────────────────────────────
  const greetingEl = document.getElementById('greeting');
  if (greetingEl) {
    const h    = new Date().getHours();
    const part = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
    const user = localStorage.getItem('currentUser');
    greetingEl.textContent = user
      ? `${part}, ${user}. Welcome to my portfolio!`
      : `${part}. Welcome to my portfolio!`;
  }

  // ── Logout button ─────────────────────────────────
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      logout();
    });
  });

  // ── Resource accordion (About page) ──────────────
  document.querySelectorAll('.resource-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.resource-item');
      const isOpen = item.classList.contains('open');

      // Close all first
      document.querySelectorAll('.resource-item').forEach(i => i.classList.remove('open'));

      if (!isOpen) item.classList.add('open');
    });
  });

  // ── Show/hide media section (Home) ────────────────
  const mediaWrap = document.querySelector('.media-grid');
  if (mediaWrap) {
    const existing = document.querySelector('.toggle-btn');
    if (!existing) {
      const btn = document.createElement('button');
      btn.className   = 'toggle-btn';
      btn.textContent = 'Show Media ▼';
      mediaWrap.parentNode.insertBefore(btn, mediaWrap);
      mediaWrap.style.display = 'none';

      btn.addEventListener('click', () => {
        const hidden = mediaWrap.style.display === 'none';
        mediaWrap.style.display = hidden ? 'grid' : 'none';
        btn.textContent = hidden ? 'Hide Media ▲' : 'Show Media ▼';
      });
    }
  }

  // ── Contact form validation ───────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      const nameEl    = document.getElementById('name');
      const emailEl   = document.getElementById('email');
      const msgEl     = document.getElementById('message');
      const nameErr   = document.getElementById('nameErr');
      const emailErr  = document.getElementById('emailErr');
      const msgErr    = document.getElementById('msgErr');
      const statusEl  = document.getElementById('submitStatus');

      // Reset
      [nameEl, emailEl, msgEl].forEach(el => el?.classList.remove('error'));
      [nameErr, emailErr, msgErr].forEach(el => el?.classList.remove('show'));

      const name  = nameEl?.value.trim();
      const email = emailEl?.value.trim();
      const msg   = msgEl?.value.trim();

      if (!name || name.length < 2) {
        nameEl?.classList.add('error');
        if (nameErr) { nameErr.textContent = 'Name must be at least 2 characters.'; nameErr.classList.add('show'); }
        valid = false;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEl?.classList.add('error');
        if (emailErr) { emailErr.textContent = 'Please enter a valid email address.'; emailErr.classList.add('show'); }
        valid = false;
      }

      if (!msg || msg.length < 10) {
        msgEl?.classList.add('error');
        if (msgErr) { msgErr.textContent = 'Message must be at least 10 characters.'; msgErr.classList.add('show'); }
        valid = false;
      }

      if (!valid) return;

      // Simulate send
      const submitBtn = contactForm.querySelector('.btn-auth, .btn-primary');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      setTimeout(() => {
        contactForm.reset();
        if (statusEl) { statusEl.textContent = '✓ Message sent successfully!'; statusEl.classList.add('show'); }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
        setTimeout(() => statusEl?.classList.remove('show'), 4000);
      }, 1000);
    });
  }

  // ── Load projects from JSON (Projects page) ───────
  loadProjects();

  // ── Filter buttons (Projects page) ───────────────
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      filterProjects(cat);
    });
  });

}); // end DOMContentLoaded

/* ── Load Projects from JSON ─────────────────────────*/
let allProjects = [];

async function loadProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  grid.innerHTML = `<div class="projects-loading"><div class="loader-ring"></div><span>Loading projects…</span></div>`;

  try {
    const res  = await fetch('data/projects.json');
    if (!res.ok) throw new Error('Network error');
    allProjects = await res.json();
    renderProjects(allProjects);
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--text-muted);font-family:var(--font-mono);font-size:13px;padding:20px;">Failed to load projects.</p>`;
    console.error('Projects JSON error:', err);
  }
}

function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  if (!projects.length) {
    grid.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">No projects found.</p>`;
    return;
  }

  grid.innerHTML = projects.map((p, i) => `
    <article class="project-card" style="animation-delay:${i * 0.08}s">
      <img class="project-img"
           src="${p.image}"
           alt="${p.title}"
           loading="lazy"
           onerror="this.style.background='var(--surface-2)';this.style.height='160px';">
      <div class="project-body">
        <p class="project-category">${p.category} · ${p.year}</p>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.description}</p>
        <div class="project-tags">
          ${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');
}

function filterProjects(category) {
  if (category === 'all') {
    renderProjects(allProjects);
  } else {
    renderProjects(allProjects.filter(p => p.category === category));
  }
}

/* ── Logout ──────────────────────────────────────────*/
function logout() {
  localStorage.removeItem('currentUser');
  showToast('You have been logged out.');
  setTimeout(() => { window.location.href = 'index.html'; }, 1200);
}

/* ── Toast (used by logout / forms) ─────────────────*/
function showToast(message, type = 'info') {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.className = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:28px;right:28px;z-index:9999;
      background:var(--surface);border:1px solid var(--border);
      border-radius:12px;padding:14px 20px;font-size:14px;
      color:var(--text);box-shadow:0 8px 32px rgba(0,0,0,0.4);
      transform:translateY(20px);opacity:0;
      transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
      max-width:320px;font-family:var(--font-body,sans-serif);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity   = '1';
  });
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity   = '0';
  }, 3000);
}