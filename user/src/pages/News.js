// News & Announcements Page (User Panel)
const esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };

export default class News {
  constructor() {
    this.container = document.getElementById('main-content');
    this.items = [];
    this.activeTab = 'ALL'; // ALL, NEWS, ANNOUNCEMENT
    this.selectedItem = null;

    this.onNewsUpdate = (event) => {
      const update = event.detail;
      if (update && update.entityType === 'NEWS') {
        this.loadData();
      }
    };
  }

  async render() {
    this.container.innerHTML = this.getSkeletonHTML();
    window.addEventListener('robotronix-update', this.onNewsUpdate);
    await this.loadData();
  }

  getSkeletonHTML() {
    return `
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1><i class="fas fa-newspaper"></i> Yangiliklar va E'lonlar</h1>
            <p>So'nggi yangiliklar va muhim e'lonlar</p>
          </div>
        </div>
      </div>
      <div class="news-page-container">
        <div class="news-tabs">
          <button class="news-tab active" data-tab="ALL">Barchasi</button>
          <button class="news-tab" data-tab="NEWS"><i class="fas fa-newspaper"></i> Yangiliklar</button>
          <button class="news-tab" data-tab="ANNOUNCEMENT"><i class="fas fa-bullhorn"></i> E'lonlar</button>
        </div>
        <div class="news-items-grid" id="newsItemsGrid">
          <div class="loading"><i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...</div>
        </div>
      </div>
    `;
  }

  async loadData() {
    try {
      const { default: api } = await import('../services/api.js');
      const data = await api.get('/public/news?audience=USER_PANEL&limit=50');
      this.items = data || [];
      this.renderContent();
    } catch (error) {
      console.error('Yangiliklar yuklanmadi:', error);
      const grid = document.getElementById('newsItemsGrid');
      if (grid) {
        grid.innerHTML = `
          <div class="news-empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>Yangiliklar yuklanmadi</p>
            <button class="news-retry-btn" id="retryBtn"><i class="fas fa-redo"></i> Qayta urinish</button>
          </div>
        `;
        document.getElementById('retryBtn')?.addEventListener('click', () => this.loadData());
      }
    }
  }

  renderContent() {
    // Attach tab events
    const tabs = document.querySelectorAll('.news-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        this.renderItems();
      });
    });

    this.renderItems();
  }

  renderItems() {
    const grid = document.getElementById('newsItemsGrid');
    if (!grid) return;

    let filtered = this.items;
    if (this.activeTab !== 'ALL') {
      filtered = this.items.filter(item => item.type === this.activeTab);
    }

    // Pinned items first
    const pinned = filtered.filter(item => item.isPinned);
    const regular = filtered.filter(item => !item.isPinned);

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="news-empty-state">
          <i class="fas fa-inbox"></i>
          <p>${this.activeTab === 'NEWS' ? 'Yangiliklar' : this.activeTab === 'ANNOUNCEMENT' ? "E'lonlar" : "Yangiliklar va e'lonlar"} hozircha mavjud emas</p>
        </div>
      `;
      return;
    }

    const renderCard = (item) => {
      const typeInfo = item.type === 'ANNOUNCEMENT'
        ? { icon: 'fas fa-bullhorn', label: "E'lon", colorClass: 'announcement' }
        : { icon: 'fas fa-newspaper', label: 'Yangilik', colorClass: 'news' };

      const date = item.publishedAt || item.createdAt;
      const dateStr = date ? new Date(date).toLocaleDateString('uz-UZ', {
        day: '2-digit', month: 'long', year: 'numeric'
      }) : '';

      const imageHtml = item.imageUrl
        ? `<div class="news-card-img"><img src="${esc(item.imageUrl)}" alt="${esc(item.title)}" loading="lazy" onerror="this.onerror=null;this.src='/default-image.svg'" /></div>`
        : '';

      const pinHtml = item.isPinned
        ? `<span class="news-pin"><i class="fas fa-thumbtack"></i></span>`
        : '';

      const summaryHtml = item.summary
        ? `<p class="news-card-desc">${esc(item.summary)}</p>`
        : '';

      return `
        <div class="news-card ${item.isPinned ? 'pinned' : ''}" data-id="${item.id}">
          ${imageHtml}
          <div class="news-card-body">
            <div class="news-card-top">
              <span class="news-type-label ${typeInfo.colorClass}">
                <i class="${typeInfo.icon}"></i> ${typeInfo.label}
              </span>
              ${pinHtml}
            </div>
            <h3 class="news-card-title">${esc(item.title)}</h3>
            ${summaryHtml}
            <div class="news-card-bottom">
              <span class="news-card-date"><i class="fas fa-calendar-alt"></i> ${dateStr}</span>
              <button class="news-read-btn" data-id="${item.id}">Batafsil <i class="fas fa-arrow-right"></i></button>
            </div>
          </div>
        </div>
      `;
    };

    const allItems = [...pinned, ...regular];
    grid.innerHTML = allItems.map(renderCard).join('');

    // Attach read more click events
    grid.querySelectorAll('.news-read-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const item = this.items.find(i => i.id === id);
        if (item) this.showDetail(item);
      });
    });

    grid.querySelectorAll('.news-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        const item = this.items.find(i => i.id === id);
        if (item) this.showDetail(item);
      });
    });
  }

  showDetail(item) {
    const typeInfo = item.type === 'ANNOUNCEMENT'
      ? { icon: 'fas fa-bullhorn', label: "E'lon", colorClass: 'announcement' }
      : { icon: 'fas fa-newspaper', label: 'Yangilik', colorClass: 'news' };

    const date = item.publishedAt || item.createdAt;
    const dateStr = date ? new Date(date).toLocaleDateString('uz-UZ', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '';

    const imageHtml = item.imageUrl
      ? `<div class="detail-image"><img src="${esc(item.imageUrl)}" alt="${esc(item.title)}" onerror="this.onerror=null;this.src='/default-image.svg'" /></div>`
      : '';

    const overlay = document.createElement('div');
    overlay.className = 'news-detail-overlay';
    overlay.innerHTML = `
      <div class="news-detail-modal">
        <button class="news-detail-close"><i class="fas fa-times"></i></button>
        ${imageHtml}
        <div class="news-detail-body">
          <div class="news-detail-meta">
            <span class="news-type-label ${typeInfo.colorClass}">
              <i class="${typeInfo.icon}"></i> ${typeInfo.label}
            </span>
            <span class="news-detail-date"><i class="fas fa-calendar-alt"></i> ${dateStr}</span>
          </div>
          <h2 class="news-detail-title">${esc(item.title)}</h2>
          ${item.summary ? `<p class="news-detail-summary">${esc(item.summary)}</p>` : ''}
          <div class="news-detail-content">${esc(item.content)}</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('.news-detail-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }


  destroy() {
    window.removeEventListener('robotronix-update', this.onNewsUpdate);
  }
}

