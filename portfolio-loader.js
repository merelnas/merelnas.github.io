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
  function buildNav(navYears, s) {
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
        `<a class="m-nav-item" href="/"><span class="m-nav-title">Home</span></a>` +
        `<a class="m-nav-item" href="/info"><span class="m-nav-title">Info</span></a>` +
        sorted.map(y => `<a class="m-nav-item" href="/${y}"><span class="m-nav-title">${y}</span></a>`).join('') +
        (s && s.instagram ? `<a class="m-nav-item ig-link" href="https://instagram.com/${s.instagram.replace('@','')}" target="_blank" rel="noopener noreferrer"><span class="m-nav-title" style="font-size:clamp(1.2rem,6vw,2rem);font-style:normal;opacity:.5">Instagram</span></a>` : '');
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
    if (navYears.length) buildNav(navYears, s);
  }

  // ── Info page ─────────────────────────────────────────────────
  function buildInfoPage(s) {
    const bio         = s.bio || '';
    const allExh      = (s.exhibitions || []).slice();
    const upcoming    = allExh.filter(e => e.upcoming).sort((a,b) => (a.year||9999)-(b.year||9999));
    const past        = allExh.filter(e => !e.upcoming).sort((a,b) => (b.year||0)-(a.year||0));
    const exhibitions = [...upcoming, ...past];
    const education   = (s.education   || []).slice().sort((a,b) => (b.year||0)-(a.year||0));

    const bioHtml = bio
      ? bio.split('\n').filter(l=>l.trim()).map(l=>`<p>${esc(l)}</p>`).join('')
      : '<p style="opacity:.4">Bio coming soon.</p>';

    const listHtml = (items, emptyMsg) => items.length
      ? `<ul class="info-list">${items.map(e=>`
          <li${e.upcoming?' style="opacity:1"':''}>
            <span class="info-year">${e.upcoming ? '<span style="font-size:9px;font-weight:700;color:#824f62;text-transform:uppercase;letter-spacing:.05em">Soon</span>' : esc(String(e.year||''))}</span>
            <span>${esc(e.title)}${(e.venue||e.institution)?`<br><span style="opacity:.5">${esc(e.venue||e.institution)}</span>`:''}</span>
          </li>`).join('')}</ul>`
      : `<p style="opacity:.4;font-size:.9rem">${emptyMsg}</p>`;

    const portraitSrc = s.portraitImage || '';
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
        ${portraitSrc ? `<img src="${esc(portraitSrc)}" alt="Artist portrait" class="info-portrait">` : ''}
        ${s.email?`<div class="info-contact-item">
          <div class="info-contact-label">Email</div>
          <div class="info-contact-value"><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div>
        </div>`:''}
        ${s.instagram?`<div class="info-contact-item">
          <div class="info-contact-label">Instagram</div>
          <div class="info-contact-value"><a href="https://instagram.com/${esc(s.instagram)}" target="_blank" rel="noopener noreferrer">@${esc(s.instagram)}</a></div>
        </div>`:''}
        ${s.cvFile?`<div class="info-contact-item">
          <div class="info-contact-label">Portfolio</div>
          <div class="info-contact-value"><a href="/${esc(s.cvFile)}" target="_blank" rel="noopener noreferrer" download>Download PDF</a></div>
        </div>`:''}
        ${s.contactText?`<div class="info-contact-item">
          <div class="info-contact-value" style="opacity:.6;font-size:.85rem;line-height:1.6">${esc(s.contactText)}</div>
        </div>`:''}
      </aside>
    </div>`;
  }

  // ── Gallery ───────────────────────────────────────────────────
  // Resolve image from any format
  function resolveImage(image) {
    if (!image) return '';
    if (typeof image === 'string') return image.startsWith('http') || image.startsWith('/') ? image : '/' + image;
    if (image.type === 'base64') return image.data;
    if (image.type === 'file') return '/images/' + image.name;
    return '';
  }

  // Each work has images[]; grid shows images[0]; clicking opens a lightbox
  // that scrolls through ALL of that work's images.
  function buildGallery(works) {
    // Grid: one thumbnail per work (cover = first image)
    const thumbs = works.map((work, wi) => {
      const cover = resolveImage((work.images || [])[0]);
      return `
      <div class="masonry-item">
        <a href="#pf-w-${wi}-0">
          <img src="${esc(cover)}" alt="${esc(work.title)}" loading="lazy">
        </a>
      </div>`;
    }).join('');

    // Lightboxes: for each work, one lightbox per image, prev/next cycle within the work
    const lightboxes = works.map((work, wi) => {
      const imgs = work.images || [];
      return imgs.map((img, ii) => {
        const src = resolveImage(img);
        const prev = ii === 0 ? imgs.length - 1 : ii - 1;
        const next = ii === imgs.length - 1 ? 0 : ii + 1;
        const multi = imgs.length > 1;
        return `
      <div id="pf-w-${wi}-${ii}" class="lightbox">
        <a href="#!" class="lightbox-close"></a>
        <a href="#!" class="lightbox-x">✕</a>
        <div class="lightbox-content">
          ${multi?`<a href="#pf-w-${wi}-${prev}" class="lightbox-prev">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </a>`:''}
          <div class="lightbox-image-container">
            <img src="${esc(src)}" alt="${esc(work.title)}">
            <div class="lightbox-info">
              <h3>${esc(work.title)}</h3>
              ${work.description?`<p>${esc(work.description)}</p>`:''}
              ${work.material?`<p style="opacity:.6;font-size:13px">${esc(work.material)}${work.dimensions?' · '+esc(work.dimensions):''}</p>`:''}
              <span class="year">${esc(String(work.year||''))}${multi?` · ${ii+1}/${imgs.length}`:''}</span>
            </div>
          </div>
          ${multi?`<a href="#pf-w-${wi}-${next}" class="lightbox-next">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </a>`:''}
        </div>
      </div>`;
      }).join('');
    }).join('');

    return `<div class="masonry">${thumbs}</div>${lightboxes}`;
  }

  // Fetch the manifest (single source of truth for the website)
  function fetchManifest() {
    return fetch(`/data/manifest.json?v=${Date.now()}`)
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

    const sitePromise = fetch('/site.json?v=' + Date.now())
      .then(r => r.ok ? r.json() : {}).catch(() => ({}));

    sitePromise.then(s => applySiteSettings(s));

    // Info page
    const infoContainer = document.getElementById('info-grid');
    if (infoContainer) {
      sitePromise.then(s => { infoContainer.innerHTML = buildInfoPage(s); const m=document.querySelector('main'); if(m) m.style.opacity='1'; });
      return;
    }

    // Gallery
    const container = document.getElementById('portfolio-grid');
    if (!container) return;
    container.innerHTML = '';

    fetchManifest().then(allWorks => {
      if (!Array.isArray(allWorks) || !allWorks.length) {
        container.innerHTML = '<div class="gallery-container"><p style="text-align:center;padding:3rem;opacity:.4;font-size:14px">No works added yet.</p></div>';
        document.querySelector('main').style.opacity = '1';
        return;
      }
      // sort by order, then newest year
      allWorks.sort((a,b) => (a.order||0)-(b.order||0) || (b.year||0)-(a.year||0));

      let works;
      if (isIndex()) {
        // Homepage = one continuous flow of every work
        works = allWorks;
      } else {
        // Year page = filter to that year
        const y = detectYear();
        works = allWorks.filter(w => String(w.year) === String(y));
      }

      if (!works.length) {
        container.innerHTML = '<div class="gallery-container"><p style="text-align:center;padding:3rem;opacity:.4;font-size:14px">No works in this year yet.</p></div>';
      } else {
        container.innerHTML = `<div class="gallery-container">${buildGallery(works)}</div>`;
      }
      document.querySelector('main').style.opacity = '1';
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
