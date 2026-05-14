// News & Announcements Page (User Panel)
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
      ${this.getStyles()}
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
        ? `<div class="news-card-img"><img src="${item.imageUrl}" alt="${item.title}" loading="lazy" /></div>`
        : '';

      const pinHtml = item.isPinned
        ? `<span class="news-pin"><i class="fas fa-thumbtack"></i></span>`
        : '';

      const summaryHtml = item.summary
        ? `<p class="news-card-desc">${item.summary}</p>`
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
            <h3 class="news-card-title">${item.title}</h3>
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
      ? `<div class="detail-image"><img src="${item.imageUrl}" alt="${item.title}" /></div>`
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
          <h2 class="news-detail-title">${item.title}</h2>
          ${item.summary ? `<p class="news-detail-summary">${item.summary}</p>` : ''}
          <div class="news-detail-content">${item.content}</div>
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

  getStyles() {
    return `
      <style>
        .news-page-container {
          padding: 20px 0;
        }

        /*  Tabs  */
        .news-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .news-tab {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #8b92a7;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .news-tab:hover {
          background: rgba(0, 102, 255, 0.08);
          color: #8b92a7;
          border-color: rgba(0, 102, 255, 0.2);
        }

        .news-tab.active {
          background: #214291;
          color: #fff;
          border-color: rgba(0, 102, 255, 0.4);
        }

        /*  Grid  */
        .news-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        /*  Card  */
        .news-card {
          background: var(--card-bg, #1a1d29);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .news-card:hover {
          border-color: rgba(0, 102, 255, 0.3);
          transform: translateY(-5px);
        }

        .news-card.pinned {
          border-color: rgba(245, 158, 11, 0.3);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.08);
        }

        .news-card.pinned:hover {
          box-shadow: 0 12px 32px rgba(245, 158, 11, 0.15);
        }

        .news-card-img {
          height: 180px;
          overflow: hidden;
          position: relative;
        }

        .news-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .news-card:hover .news-card-img img {
          transform: scale(1.08);
        }

        .news-card-body {
          padding: 16px 20px 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .news-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .news-type-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .news-type-label.news {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }

        .news-type-label.announcement {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }

        .news-pin {
          color: #f59e0b;
          font-size: 0.9rem;
          animation: pinPulse 2s ease infinite;
        }

        @keyframes pinPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15) rotate(10deg); }
        }

        .news-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary, #fff);
          margin: 0 0 8px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .news-card-desc {
          color: var(--text-secondary, #8b92a7);
          font-size: 0.88rem;
          line-height: 1.5;
          margin: 0 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .news-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .news-card-date {
          color: #8b92a7;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .news-read-btn {
          background: none;
          border: none;
          color: #0066ff;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .news-read-btn:hover {
          background: rgba(0, 102, 255, 0.1);
          color: #00ccff;
        }

        /*  Empty State  */
        .news-empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #8b92a7;
          grid-column: 1 / -1;
        }

        .news-empty-state i {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.3;
          display: block;
        }

        .news-retry-btn {
          background: rgba(0, 102, 255, 0.1);
          border: 1px solid rgba(0, 102, 255, 0.3);
          color: #0066ff;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .news-retry-btn:hover {
          background: rgba(0, 102, 255, 0.2);
        }

        /*  Detail Modal  */
        .news-detail-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .news-detail-overlay.visible {
          opacity: 1;
        }

        .news-detail-modal {
          background: var(--card-bg, #1a1d29);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          transform: translateY(20px);
          transition: transform 0.3s ease;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
        }

        .news-detail-overlay.visible .news-detail-modal {
          transform: translateY(0);
        }

        .news-detail-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 5;
        }

        .news-detail-close:hover {
          background: rgba(239, 68, 68, 0.5);
          transform: rotate(90deg);
        }

        .detail-image {
          width: 100%;
          max-height: 350px;
          overflow: hidden;
        }

        .detail-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .news-detail-body {
          padding: 24px;
        }

        .news-detail-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .news-detail-date {
          color: #8b92a7;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .news-detail-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary, #fff);
          margin: 0 0 12px;
          line-height: 1.4;
        }

        .news-detail-summary {
          color: #00ccff;
          font-size: 1rem;
          line-height: 1.5;
          margin: 0 0 20px;
          font-weight: 500;
        }

        .news-detail-content {
          color: var(--text-secondary, #c5c9d6);
          font-size: 0.95rem;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        /*  Scrollbar  */
        .news-detail-modal::-webkit-scrollbar { width: 6px; }
        .news-detail-modal::-webkit-scrollbar-track { background: transparent; }
        .news-detail-modal::-webkit-scrollbar-thumb {
          background: rgba(0, 102, 255, 0.3);
          border-radius: 3px;
        }

        /*  Responsive  */
        @media (max-width: 768px) {
          .news-items-grid {
            grid-template-columns: 1fr;
          }
          .news-tabs {
            gap: 6px;
          }
          .news-tab {
            padding: 8px 14px;
            font-size: 0.82rem;
          }
          .news-detail-modal {
            max-height: 95vh;
            border-radius: 16px;
          }
          .news-detail-title {
            font-size: 1.2rem;
          }
          .news-detail-body {
            padding: 16px;
          }
        }

        @media (max-width: 480px) {
          .news-card-img {
            height: 140px;
          }
          .news-card-body {
            padding: 12px 16px 16px;
          }
          .news-card-bottom {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
        }
      </style>
    `;
  }

  destroy() {
    window.removeEventListener('robotronix-update', this.onNewsUpdate);
  }
}

