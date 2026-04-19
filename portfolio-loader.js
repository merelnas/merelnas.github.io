/**
 * portfolio-loader.js
 * - index.html  : loads all years newest-first
 * - year.html   : detects year from URL, loads that year's JSON
 * - info.html   : renders bio, exhibitions, education, contact from site.json
 * - all pages   : builds nav from site.json navYears, applies name/instagram/etc
 */
(function () {

  function detectYear() {
    const m = window.location.pathname.match(/\b(20\d{2})\b/);
    return m ? parseInt(m[1]) : null;
  }
  function isIndex() {
    const p = window.location.pathname;
    return p === '/' || p === '/index.html' || p === '';
  }
  function isInfo() {
    return /\/info(\.html)?$/.test(window.location.pathname);
  }

  // ── Build + inject sidebar nav from navYears ──────────────────
  function buildNav(navYears) {
    const sorted = [...navYears].sort((a, b) => b - a);
    const currentYear = detectYear();

    // ── Sidebar nav ──
    const sidebar = document.getElementById('sidebar-nav-years');
    if (sidebar) {
      [...sidebar.querySelectorAll('li a')].forEach(a => {
        if (/\/20\d{2}/.test(a.getAttribute('href'))) a.parentElement.remove();
      });
      const homeLi = sidebar.querySelector('li');
      sorted.forEach(y => {
        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = '/' + y;
        a.textContent = y;
        if (currentYear === y) a.className = 'active';
        li.appendChild(a);
        homeLi ? homeLi.insertAdjacentElement('afterend', li) : sidebar.appendChild(li);
      });
    }

    // ── Mobile nav ── use innerHTML directly, no outerHTML swap
    const mobileNav = document.getElementById('mobile-nav-years');
    if (mobileNav) {
      mobileNav.innerHTML =
        `<a class="m-nav-item" href="/info"><span class="m-nav-title">Info</span></a>` +
        sorted.map(y => `<a class="m-nav-item" href="/${y}"><span class="m-nav-title">${y}</span></a>`).join('') +
        (document.querySelector('a[href*=".pdf"]') ? `<a class="m-nav-item" href="/portfolio.pdf" target="_blank"><span class="m-nav-title">Portfolio</span></a>` : '');
    }
  }

  // ── Apply site.json to page ───────────────────────────────────
  function applySiteSettings(s) {
    if (!s) return;
    if (s.instagram) {
      document.querySelectorAll('a[href*="instagram.com"]').forEach(el => {
        el.href = 'https://instagram.com/' + s.instagram.replace('@', '');
      });
    }
    if (s.cvFile) {
      document.querySelectorAll('a[href*="portfolio.pdf"], a[href*=".pdf"]').forEach(el => {
        if (!el.href.includes('mailto')) el.href = '/' + s.cvFile;
      });
    }
    const navYears = (s.navYears && s.navYears.length) ? s.navYears : (s.years || []);
    if (navYears.length) buildNav(navYears);
  }

  // ── Info page ─────────────────────────────────────────────────
  function buildInfoPage(s) {
    const bio         = s.bio || '';
    const exhibitions = (s.exhibitions || []).slice().sort((a,b) => (b.year||0)-(a.year||0));
    const education   = (s.education   || []).slice().sort((a,b) => (b.year||0)-(a.year||0));

    const bioHtml = bio
      ? bio.split('\n').filter(l=>l.trim()).map(l=>`<p>${esc(l)}</p>`).join('')
      : '<p style="opacity:.4">Bio coming soon.</p>';

    const listHtml = (items, emptyMsg) => items.length
      ? `<ul class="info-list">${items.map(e=>`
          <li>
            <span class="info-year">${esc(String(e.year||''))}</span>
            <span>${esc(e.title)}${(e.venue||e.institution)?`<br><span style="opacity:.5">${esc(e.venue||e.institution)}</span>`:''}</span>
          </li>`).join('')}</ul>`
      : `<p style="opacity:.4;font-size:.9rem">${emptyMsg}</p>`;

    return `
    <div class="info-page">
      <div class="info-main">
        <div class="info-bio">${bioHtml}</div>
        <div class="info-section">
          <h3>Exhibitions</h3>
          ${listHtml(exhibitions, 'No exhibitions listed yet.')}
        </div>
        <div class="info-section">
          <h3>Education</h3>
          ${listHtml(education, 'No education listed yet.')}
        </div>
      </div>
      <aside class="info-contact">
        ${s.email?`<div class="info-contact-item">
          <div class="info-contact-label">Email</div>
          <div class="info-contact-value"><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div>
        </div>`:''}
        ${s.instagram?`<div class="info-contact-item">
          <div class="info-contact-label">Instagram</div>
          <div class="info-contact-value"><a href="https://instagram.com/${esc(s.instagram)}" target="_blank" rel="noopener noreferrer">@${esc(s.instagram)}</a></div>
        </div>`:''}
        ${s.contactText?`<div class="info-contact-item">
          <div class="info-contact-value" style="opacity:.6;font-size:.85rem;line-height:1.6">${esc(s.contactText)}</div>
        </div>`:''}
      </aside>
    </div>`;
  }

  // ── Gallery ───────────────────────────────────────────────────
  function buildGallery(items, year) {
    const thumbs = items.map((item, i) => `
      <div class="masonry-item">
        <a href="#pf-img-${year}-${i}">
          <img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy">
        </a>
      </div>`).join('');

    const lightboxes = items.map((item, i) => {
      const prev = i === 0 ? items.length - 1 : i - 1;
      const next = i === items.length - 1 ? 0 : i + 1;
      return `
      <div id="pf-img-${year}-${i}" class="lightbox">
        <a href="#!" class="lightbox-close"></a>
        <div class="lightbox-content">
          <a href="#pf-img-${year}-${prev}" class="lightbox-prev">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </a>
          <div class="lightbox-image-container">
            <img src="${esc(item.image)}" alt="${esc(item.title)}">
            <div class="lightbox-info">
              <h3>${esc(item.title)}</h3>
              ${item.description?`<p>${esc(item.description)}</p>`:''}
              ${item.material?`<p style="opacity:.6;font-size:13px">${esc(item.material)}</p>`:''}
              <span class="year">${year}</span>
            </div>
          </div>
          <a href="#pf-img-${year}-${next}" class="lightbox-next">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </a>
        </div>
      </div>`;
    }).join('');

    return `<div class="masonry">${thumbs}</div>${lightboxes}`;
  }

  function fetchYear(year) {
    return fetch(`data/portfolio-${year}.json?v=${Date.now()}`)
      .then(r => r.ok ? r.json() : []).catch(() => []);
  }

  function toggleMenu() {
    var m = document.getElementById('mobile-menu');
    var open = m.classList.contains('open');
    m.classList.toggle('open', !open);
    m.setAttribute('aria-hidden', open ? 'true' : 'false');
    document.body.style.overflow = open ? '' : 'hidden';
  }

  // ── Main ──────────────────────────────────────────────────────
  var colors = {'about':'#9EB5B5', 'default':'#E3B959'};
  var hideTimer, isFull = false, cur = {};
  function applyColor(id) { var c = colors[id] || colors['default']; document.getElementById('popup-overlay').style.backgroundColor = c; document.getElementById('popup-header').style.backgroundColor = c; document.getElementById('popup-body-wrapper').style.backgroundColor = c; }
  function fill(title, text) { document.getElementById('popup-title').textContent = title; document.getElementById('popup-content').innerHTML = '<p>' + text + '</p>'; }
  function openAbout() { cur = {id:'about', title:'Info', text: aboutText}; applyColor('about'); fill('Info', aboutText); openFull(); }
  function closeMenu() {
    var m = document.getElementById('mobile-menu');
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function goTo(id, title, text) {
    closeMenu();
    var el = document.getElementById(id);
    if (!el) return;
    setTimeout(function() {
      smoothTo(el.getBoundingClientRect().top + window.scrollY - 60, 450);
      setTimeout(function() { cur = {id: id, title: title, text: text}; applyColor(id); fill(title, text); openFull(); }, 470);
    }, 160);
  }
  function smoothTo(y, ms) {
    var sy = window.scrollY, d = y - sy, t0 = null;
    function step(now) { if (!t0) t0 = now; var t = Math.min((now - t0) / ms, 1); var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; window.scrollTo(0, sy + d * e); if (t < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function teaser(id, title, text) { if (isFull) return; clearTimeout(hideTimer); cur = {id: id, title: title, text: text}; applyColor(id); fill(title, text); var p = document.getElementById('popup-overlay'); p.style.height = '50px'; p.classList.add('visible'); document.getElementById('popup-action-btn').textContent = 'More'; }
  function startHide() { if (!isFull) hideTimer = setTimeout(closePopup, 1000); }
  function cancelHide() { clearTimeout(hideTimer); }
  function openFull() { if (cur.id) { applyColor(cur.id); fill(cur.title, cur.text); } isFull = true; clearTimeout(hideTimer); var p = document.getElementById('popup-overlay'); p.classList.add('is-full'); p.style.height = '62vh'; p.classList.add('visible'); document.getElementById('popup-action-btn').textContent = 'Close'; }
  function handleBtn() { isFull ? closePopup() : openFull(); }
  function closePopup() { isFull = false; var p = document.getElementById('popup-overlay'); p.classList.remove('is-full'); p.classList.add('notransition'); p.style.height = '50px'; p.getBoundingClientRect(); p.classList.remove('notransition'); p.classList.remove('visible'); }
  document.addEventListener('click', function(e) { var mm = document.getElementById('mobile-menu'); if (!mm || !mm.classList.contains('open')) return; if (e.target.closest('.menu-icon')) return; if (!mm.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { closeMenu(); closePopup(); } });

  // ── Main ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {

    const sitePromise = fetch('site.json?v=' + Date.now())
      .then(r => r.ok ? r.json() : {}).catch(() => ({}));

    sitePromise.then(s => applySiteSettings(s));

    // Info page
    const infoContainer = document.getElementById('info-grid');
    if (infoContainer) {
      sitePromise.then(s => { infoContainer.innerHTML = buildInfoPage(s); });
      return;
    }

    // Gallery
    const container = document.getElementById('portfolio-grid');
    if (!container) return;

    const yearsPromise = isIndex()
      ? sitePromise.then(s => {
          const ny = (s.navYears && s.navYears.length) ? s.navYears : (s.years || []);
          return [...ny].sort((a,b) => b-a);
        })
      : Promise.resolve([detectYear()].filter(Boolean));

    container.innerHTML = '<div class="gallery-container"><p style="text-align:center;padding:3rem;opacity:.4;font-size:14px">Loading…</p></div>';

    yearsPromise.then(years => {
      if (!years.length) {
        container.innerHTML = '<div class="gallery-container"><p style="text-align:center;padding:3rem;opacity:.4;font-size:14px">Could not detect year.</p></div>';
        return;
      }
      Promise.all(years.map(y => fetchYear(y).then(items => ({ year: y, items }))))
        .then(results => {
          const filled = results.filter(r => r.items && r.items.length);
          if (!filled.length) {
            container.innerHTML = '<div class="gallery-container"><p style="text-align:center;padding:3rem;opacity:.4;font-size:14px">No works added yet.</p></div>';
            return;
          }
          if (isIndex()) {
            container.innerHTML = filled.map(({year, items}) =>
              `<div class="gallery-container" id="year-section-${year}">${buildGallery(items, year)}</div>`
            ).join('');
            document.querySelector('main').style.opacity = '1';
          } else {
            const {year, items} = filled[0];
            container.innerHTML = `<div class="gallery-container">${buildGallery(items, year)}</div>`;
            document.querySelector('main').style.opacity = '1';
          }
        });
    });
  });

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  window.toggleMenu = toggleMenu;
  window.closeMenu = closeMenu;
  window.openAbout = openAbout;
  window.goTo = goTo;
  window.handleBtn = handleBtn;

})();
