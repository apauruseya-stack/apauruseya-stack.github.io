/* app.js - data-driven renderer for the Reikai hub */
(function () {
  'use strict';

  const DATA_URL = 'data/projects.json';
  let DATA = null;
  let query = '';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  async function load() {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-cache' });
      DATA = await res.json();
      render();
    } catch (e) {
      console.error('Failed to load projects.json', e);
      const grid = $('#projects');
      if (grid) grid.innerHTML = '<div class="empty"><h3>Could not load projects</h3><p>Check data/projects.json</p></div>';
    }
  }

  function render() {
    if (!DATA) return;
    const site = DATA.site || {};
    document.title = site.name || 'Reikai';
    const titleEl = $('#site-title');
    if (titleEl) titleEl.textContent = site.name || 'Reikai';
    const taglineEl = $('#site-tagline');
    if (taglineEl) taglineEl.textContent = site.tagline || '';
    const descEl = $('#site-desc');
    if (descEl) descEl.textContent = site.description || '';

    // stats
    const projects = DATA.projects || [];
    const stable = projects.filter(p => p.status === 'stable').length;
    const planned = projects.filter(p => p.status === 'planned').length;
    const stats = $('#stats');
    if (stats) {
      stats.innerHTML = `
        <div class="stat"><div class="num">${projects.length}</div><div class="lbl">Projects</div></div>
        <div class="stat"><div class="num">${stable}</div><div class="lbl">Stable</div></div>
        <div class="stat"><div class="num">${planned}</div><div class="lbl">Planned</div></div>
        <div class="stat"><div class="num">${new Set(projects.flatMap(p => p.tags || [])).size}</div><div class="lbl">Tags</div></div>
      `;
    }

    // one-liner
    const oneLiner = $('#one-liner');
    if (oneLiner && site.installOneLiner) oneLiner.textContent = site.installOneLiner;

    // categories sorted
    const cats = (DATA.categories || []).slice().sort((a, b) => (a.order || 99) - (b.order || 99));
    const container = $('#projects');
    if (!container) return;

    const q = query.trim().toLowerCase();
    let totalShown = 0;

    const sectionsHtml = cats.map(cat => {
      const projectsInCat = projects
        .filter(p => p.category === cat.id)
        .filter(p => matches(p, q));
      if (projectsInCat.length === 0 && q) return '';
      totalShown += projectsInCat.length;
      const cards = projectsInCat.map(cardHtml).join('');
      return `
        <section class="section" data-category="${cat.id}">
          <div class="section-head">
            <h2>${escape(cat.icon || '')} ${escape(cat.name)}</h2>
            <span class="count">${projectsInCat.length}</span>
            <span class="toggle" data-toggle="${cat.id}">collapse</span>
          </div>
          <div class="grid" data-grid="${cat.id}">${cards || '<div class="empty"><h3>No projects match</h3><p>Try a different search.</p></div>'}</div>
        </section>
      `;
    }).join('');

    container.innerHTML = sectionsHtml || '<div class="empty"><h3>No results</h3><p>Nothing matches your search.</p></div>';

    // toggle handlers
    $$('[data-toggle]').forEach(t => {
      t.addEventListener('click', () => {
        const id = t.dataset.toggle;
        const grid = document.querySelector(`[data-grid="${id}"]`);
        if (grid) {
          const collapsed = grid.style.display === 'none';
          grid.style.display = collapsed ? '' : 'none';
          t.textContent = collapsed ? 'collapse' : 'expand';
        }
      });
    });

    // copy button
    const copyBtn = $('#copy-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const code = $('#one-liner');
        if (!code) return;
        navigator.clipboard.writeText(code.textContent).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
        }).catch(() => {});
      };
    }
  }

  function matches(p, q) {
    if (!q) return true;
    const hay = [p.name, p.tagline, p.description, (p.tags || []).join(' '), (p.highlights || []).join(' ')].join(' ').toLowerCase();
    return hay.includes(q);
  }

  function cardHtml(p) {
    const status = p.status || 'stable';
    const icon = (p.name || '?').charAt(0).toUpperCase();
    const tags = (p.tags || []).map(t => `<span class="tag">${escape(t)}</span>`).join('');
    const highlights = (p.highlights || []).map(h => `<li>${escape(h)}</li>`).join('');
    const links = p.links || {};
    const linkBtns = [];
    if (links.github) linkBtns.push(`<a href="${escape(links.github)}" target="_blank" rel="noopener">GitHub</a>`);
    if (links.docs) linkBtns.push(`<a href="${escape(links.docs)}" target="_blank" rel="noopener">Docs</a>`);
    if (links.release) linkBtns.push(`<a href="${escape(links.release)}" target="_blank" rel="noopener">Release</a>`);
    if (links.install) linkBtns.push(`<a href="${escape(links.install)}" class="primary" target="_blank" rel="noopener">Install</a>`);
    const planned = status === 'planned';
    return `
      <article class="card ${planned ? 'planned' : ''}">
        <div class="card-top">
          <div class="card-icon">${escape(icon)}</div>
          <div>
            <div class="card-title">${escape(p.name)}</div>
            <div class="card-tagline">${escape(p.tagline || '')}</div>
          </div>
          <span class="status ${status}" style="margin-left:auto">${escape(status)}</span>
        </div>
        <div class="card-desc">${escape(p.description || '')}</div>
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        ${highlights ? `<ul class="card-highlights">${highlights}</ul>` : ''}
        ${linkBtns.length ? `<div class="card-links">${linkBtns.join('')}</div>` : ''}
      </article>
    `;
  }

  function escape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Search wiring
  function initSearch() {
    const input = $('#search');
    if (!input) return;
    input.addEventListener('input', (e) => {
      query = e.target.value;
      render();
    });
    // focus on /
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    load();
  });
})();