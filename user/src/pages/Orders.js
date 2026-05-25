// Orders Page with List View + Detail Modal
import showConfirm from '../services/confirm.js';

const esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };

export default class Orders {
  constructor() {
    this.container = document.getElementById("main-content");
    this.orders = [];
    this.initialLoad = true;
    this.selectedOrder = null;
    this._trackingCache = new Map(); // orderId → { statusName, officeName, ts }
    this._trackingInterval = null;
    this.onOrderUpdate = (event) => {
      const update = event.detail;
      if (update && update.entityType === 'ORDER') {
        this.loadOrders();
      }
    };
  }

  _uzpostStatusLabel(status) {
    const map = {
      unassigned:         'Pochta qabul qildi',
      assigned:           'Kuryer biriktirildi',
      in_transit:         'Tranzitda',
      out_for_delivery:   'Yetkazib berilmoqda',
      delivered:          'Yetkazib berildi',
      returned:           'Qaytarildi',
      cancelled:          'Bekor qilindi',
      lost:               "Yo'qolgan",
      // eski qiymatlar (DB da saqlangan bo'lishi mumkin)
      ACCEPTED:           'Pochta qabul qildi',
      IN_TRANSIT:         'Tranzitda',
      OUT_FOR_DELIVERY:   'Yetkazib berilmoqda',
      DELIVERED:          'Yetkazib berildi',
      RETURNED:           'Qaytarildi',
      CANCELLED:          'Bekor qilindi',
    };
    return map[status] || status;
  }

  async _loadTrackingDetail(orderId) {
    const el = document.getElementById(`tracking-detail-${orderId}`);
    const btn = document.getElementById(`tracking-btn-${orderId}`);
    if (!el || !btn) return;

    if (el.style.display === 'block') {
      el.style.display = 'none';
      btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Kuzatish';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
      const { default: api } = await import('../services/api.js');
      const data = await api.get(`/orders/${orderId}/tracking`);
      const d = data?.data ?? data;
      const statusCode = d?.status ?? '';
      const locations = d?.locations ?? [];

      if (!statusCode) {
        el.innerHTML = '<p style="color:#8b92a7;font-size:13px;margin-top:8px;">Kuzatuv ma\'lumoti topilmadi</p>';
        el.style.display = 'block';
        return;
      }

      // Cache yangilash
      const deliveryLoc = locations.find(l => l.pickup === false);
      const city = deliveryLoc?.addressCity || deliveryLoc?.address || '';
      const statusLabel = this._uzpostStatusLabel(statusCode);
      this._trackingCache.set(orderId, { statusName: statusLabel, officeName: city, ts: Date.now() });
      this._applyTrackingBadge(orderId, statusLabel, city);

      let html = `<div style="margin-top:10px; padding:12px; background:rgba(255,255,255,0.04); border-radius:8px; border:1px solid #2d3748;">
        <div style="margin-bottom:8px;">
          <span style="color:#8b92a7; font-size:12px;">Joriy holat: </span>
          <span style="color:#4ade80; font-weight:600;">${esc(statusLabel)}</span>
        </div>`;

      if (locations.length > 0) {
        html += `<div style="font-size:12px; color:#8b92a7; margin-bottom:6px;">Marshrut:</div>
          <div style="position:relative; padding-left:16px;">
          <div style="position:absolute; left:5px; top:4px; bottom:4px; width:2px; background:rgba(99,102,241,0.3);"></div>`;
        locations.forEach(loc => {
          const addr = loc.addressCity || loc.address || '—';
          const dotColor = loc.pickup ? '#6366f1' : '#4ade80';
          const label = loc.pickup ? "Jo'natuvchi" : 'Qabul qiluvchi';
          html += `<div style="display:flex; align-items:center; gap:8px; font-size:13px; color:#e2e8f0; margin-bottom:8px; position:relative;">
            <div style="width:8px; height:8px; border-radius:50%; background:${dotColor}; border:2px solid #1e2640; flex-shrink:0; position:absolute; left:-5px;"></div>
            <span style="padding-left:8px;">${esc(addr)}</span>
            <span style="color:#8b92a7; font-size:11px;">(${label})</span>
          </div>`;
        });
        html += '</div>';
      }

      html += '</div>';
      el.innerHTML = html;
      el.style.display = 'block';
    } catch (_) {
      el.innerHTML = '<p style="color:#f87171;font-size:13px;margin-top:8px;">Kuzatuv ma\'lumotini yuklab bo\'lmadi</p>';
      el.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Batafsil tarix';
    }
  }

  async render() {
    this.container.innerHTML = `
            <div class="page-header">
                <div class="header-content">
                    <div>
                        <h1><i class="fas fa-shopping-bag"></i> Buyurtmalarim</h1>
                        <p>Barcha buyurtmalar tarixi va holati</p>
                    </div>
                    <div class="header-actions">
                        <span class="refresh-indicator" id="refreshIndicator">
                            <i class="fas fa-sync-alt"></i> Avtomatik yangilanmoqda
                        </span>
                    </div>
                </div>
            </div>

            <div class="orders-container">
                <div class="orders-table-wrapper" id="ordersList">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Buyurtmalar yuklanmoqda...</p>
                    </div>
                </div>
            </div>

            <!-- Order Detail Modal -->
            <div class="modal-overlay" id="orderModal" style="display: none;">
                <div class="modal-content detail-modal">
                    <div class="modal-header">
                        <h2 id="modalTitle">Buyurtma tafsilotlari</h2>
                        <button class="close-btn" id="closeModal">&times;</button>
                    </div>
                    <div class="modal-body" id="modalBody"></div>
                </div>
            </div>
        `;

    // Global funksiyalar yaratish
    window.confirmDelivery = (orderId) => this.confirmDelivery(orderId);
    window.retryOrderPayment = (orderId) => this.retryOrderPayment(orderId);

    // Modal yopish eventlari
    document
      .getElementById("closeModal")
      .addEventListener("click", () => this.closeModal());
    document.getElementById("orderModal").addEventListener("click", (e) => {
      if (e.target.id === "orderModal") this.closeModal();
    });

    await this.loadOrders();

    // Har 60 soniyada tracking ni yangilash
    this._trackingInterval = setInterval(() => {
      this._fetchAllTracking();
    }, 60_000);

    // Listen for real-time updates via WebSocket sync
    window.addEventListener('robotronix-update', this.onOrderUpdate);
  }

  async loadOrders(silent = false) {
    try {
      if (!silent) {
        const indicator = document.getElementById("refreshIndicator");
        if (indicator) indicator.classList.add("refreshing");
      }

      const { default: api } = await import("../services/api.js");
      const newOrders = await api.get("/orders/my");

      if (this.initialLoad || JSON.stringify(newOrders) !== JSON.stringify(this.orders)) {
        this.orders = newOrders;
        this.renderOrders();
        this.initialLoad = false;
        // Agar modal ochiq bo'lsa, modalni ham yangilash
        if (this.selectedOrder) {
          const updated = this.orders.find(
            (o) => o.id === this.selectedOrder.id,
          );
          if (updated) {
            this.selectedOrder = updated;
            this.renderModalContent(updated);
          }
        }
      }

      if (!silent) {
        const indicator = document.getElementById("refreshIndicator");
        if (indicator)
          setTimeout(() => indicator.classList.remove("refreshing"), 500);
      }
    } catch (error) {
      console.error("Buyurtmalarni yuklashda xatolik:", error);
      if (!silent) {
        document.getElementById("ordersList").innerHTML = `
                    <div class="empty-state error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Xatolik yuz berdi</h3>
                        <p>Buyurtmalarni yuklashda muammo yuzaga keldi</p>
                        <button class="btn-primary" onclick="location.reload()">
                            <i class="fas fa-redo"></i> Qayta urinish
                        </button>
                    </div>
                `;
      }
    }
  }

  getStatusInfo(status) {
    const statusMap = {
      PENDING:         { class: "warning",   text: "To'lov kutilmoqda", icon: "fa-credit-card" },
      PAYMENT_WAITING: { class: "warning",   text: "To'lov kutilmoqda", icon: "fa-credit-card" },
      CONFIRMED:       { class: "info",      text: "Tasdiqlandi",       icon: "fa-check-circle" },
      PREPARING:       { class: "primary",   text: "Tayyorlanmoqda",    icon: "fa-box-open" },
      SHIPPED:         { class: "secondary", text: "Yo'lda",            icon: "fa-truck" },
      DELIVERED:       { class: "delivered", text: "Yetkazildi",        icon: "fa-truck" },
      RECEIVED:        { class: "success",   text: "Qabul qilindi",     icon: "fa-check-double" },
      CANCELLED:       { class: "danger",    text: "Bekor qilindi",     icon: "fa-times-circle" },
    };
    return statusMap[status] || { class: "secondary", text: status, icon: "fa-info-circle" };
  }

  renderOrders() {
    const ordersList = document.getElementById("ordersList");

    if (!this.orders || this.orders.length === 0) {
      ordersList.innerHTML = `
                <div class="cart-empty-state">
                    <div class="empty-icon-wrapper">
                        <i class="fas fa-shopping-bag"></i>
                        <div class="icon-pulse"></div>
                    </div>
                    <h2>Buyurtmalar yo'q</h2>
                    <p>Siz hali hech qanday buyurtma bermagansiz. Bizning do'konimizdan o'zingizga yoqqan mahsulotlarni topishingiz mumkin.</p>
                    <a href="#products" class="btn-primary btn-large">
                        <i class="fas fa-store"></i> Do'konga o'tish
                    </a>
                </div>
            `;
      return;
    }

    ordersList.innerHTML = `
            <div class="orders-list-table">
                <div class="orders-list-header">
                    <span class="ol-col ol-id">№</span>
                    <span class="ol-col ol-items">Mahsulotlar</span>
                    <span class="ol-col ol-date">Sana</span>
                    <span class="ol-col ol-total">Summa</span>
                    <span class="ol-col ol-status">Holat</span>
                </div>
                ${this.orders
                  .map((order) => {
                    const status = this.getStatusInfo(order.status);
                    const date = new Date(order.createdAt).toLocaleDateString(
                      "uz-UZ",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      },
                    );
                    const items =
                      order.items && Array.isArray(order.items)
                        ? order.items
                        : [];
                    const itemsSummary =
                      items.length > 0
                        ? items
                            .map(
                              (i) =>
                                esc(i.product?.title || i.product?.name || "Mahsulot"),
                            )
                            .slice(0, 2)
                            .join(", ") +
                          (items.length > 2 ? ` +${items.length - 2}` : "")
                        : "Mahsulot yo'q";

                    const isTracked = (order.status === 'SHIPPED' || order.status === 'DELIVERED') && order.trackingNumber;
                    const cached = this._trackingCache.get(order.id);
                    const liveText = cached
                        ? (cached.officeName ? `${cached.statusName} — ${cached.officeName}` : cached.statusName)
                        : null;

                    // Tracked buyurtmalar uchun status ustuni
                    let statusCell;
                    if (isTracked) {
                        if (liveText) {
                            // Cache bor — darhol UzPost holatini ko'rsat
                            statusCell = `<span class="ol-col ol-status" id="status-col-${order.id}">
                                <span style="color:#4ade80; font-size:13px; font-weight:500;">${esc(liveText)}</span>
                            </span>`;
                        } else {
                            // Hali yuklanmagan — vaqtincha order statusini ko'rsat, keyin almashadi
                            statusCell = `<span class="ol-col ol-status" id="status-col-${order.id}">
                                <span class="status-badge status-${status.class}">
                                    <i class="fas ${status.icon}"></i> ${status.text}
                                </span>
                            </span>`;
                        }
                    } else {
                        statusCell = `<span class="ol-col ol-status">
                            <span class="status-badge status-${status.class}">
                                <i class="fas ${status.icon}"></i> ${status.text}
                            </span>
                        </span>`;
                    }

                    return `
                        <div class="orders-list-row" data-order-id="${order.id}">
                            <span class="ol-col ol-id">#${order.id}</span>
                            <span class="ol-col ol-items">
                                <span class="ol-items-text">${itemsSummary}</span>
                                <span class="ol-items-count">${items.length} ta mahsulot</span>
                            </span>
                            <span class="ol-col ol-date">${date}</span>
                            <span class="ol-col ol-total">${(order.totalAmount || 0).toLocaleString()} so'm</span>
                            ${statusCell}
                        </div>
                    `;
                  })
                  .join("")}
            </div>
        `;

    // Har bir row uchun click event
    ordersList.querySelectorAll(".orders-list-row").forEach((row) => {
      row.addEventListener("click", () => {
        const orderId = parseInt(row.dataset.orderId);
        const order = this.orders.find((o) => o.id === orderId);
        if (order) this.openModal(order);
      });
    });

    // Tracking ni yuklash (fon rejimida)
    this._fetchAllTracking();
  }

  async _fetchAllTracking() {
    const tracked = this.orders.filter(
      o => (o.status === 'SHIPPED' || o.status === 'DELIVERED') && o.trackingNumber
    );
    if (tracked.length === 0) return;

    const { default: api } = await import('../services/api.js').catch(() => ({ default: null }));
    if (!api) return;

    const now = Date.now();
    const CACHE_TTL = 60_000; // 60 soniya

    for (const order of tracked) {
      const cached = this._trackingCache.get(order.id);
      if (cached && now - cached.ts < CACHE_TTL) {
        // Cache dan yangilash
        this._applyTrackingBadge(order.id, cached.statusName, cached.officeName);
        continue;
      }

      try {
        const data = await api.get(`/orders/${order.id}/tracking`);
        const d = data?.data ?? data;
        const statusCode = d?.status ?? '';
        if (statusCode) {
          const locations = d?.locations ?? [];
          const deliveryLoc = locations.find(l => l.pickup === false);
          const city = deliveryLoc?.addressCity || deliveryLoc?.address || '';
          const entry = { statusName: this._uzpostStatusLabel(statusCode), officeName: city, ts: Date.now() };
          this._trackingCache.set(order.id, entry);
          this._applyTrackingBadge(order.id, entry.statusName, entry.officeName);
        }
      } catch (_) { /* API xatosi — skip */ }

      // UzPost API ni bosib ketmaslik uchun kichik kechikish
      await new Promise(r => setTimeout(r, 300));
    }
  }

  _applyTrackingBadge(orderId, statusName, officeName) {
    if (!statusName) return;
    const text = officeName ? `${statusName} — ${officeName}` : statusName;
    // Ro'yxatdagi status ustunini almashtirish
    const col = document.getElementById(`status-col-${orderId}`);
    if (col) col.innerHTML = `<span style="color:#4ade80; font-size:13px; font-weight:500;">${esc(text)}</span>`;
    // Modal ichidagi badge
    const modalEl = document.getElementById(`modal-live-status-${orderId}`);
    if (modalEl) { modalEl.textContent = text; modalEl.style.display = 'inline'; }
  }

  openModal(order) {
    this.selectedOrder = order;
    window._orderTrackFn = (id) => this._loadTrackingDetail(id);
    const modal = document.getElementById("orderModal");
    document.getElementById("modalTitle").innerHTML =
      `<i class="fas fa-receipt"></i> Buyurtma #${order.id}`;
    this.renderModalContent(order);
    modal.classList.add("active");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  renderModalContent(order) {
    const status = this.getStatusInfo(order.status);
    const date = new Date(order.createdAt).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const time = new Date(order.createdAt).toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    document.getElementById("modalBody").innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <label><i class="fas fa-hashtag"></i> Buyurtma ID</label>
                    <p>#${order.id}</p>
                </div>
                <div class="detail-item">
                    <label><i class="fas fa-info-circle"></i> Holati</label>
                    <div class="value">
                        <span class="status-badge status-${status.class} status-lg">
                            <i class="fas ${status.icon}"></i> ${status.text}
                        </span>
                    </div>
                </div>
                <div class="detail-item">
                    <label><i class="fas fa-calendar-alt"></i> Sana va Vaqt</label>
                    <p>${date}, ${time}</p>
                </div>
                <div class="detail-item">
                    <label><i class="fas fa-wallet"></i> Umumiy Summa</label>
                    <p class="text-primary" style="font-weight: 700;">${(order.totalAmount || 0).toLocaleString()} so'm</p>
                </div>

                ${
                  order.contactPhone
                    ? `
                <div class="detail-item">
                    <label><i class="fas fa-phone"></i> Aloqa telefon</label>
                    <p>${esc(order.contactPhone)}</p>
                </div>`
                    : ""
                }

                ${
                  order.shippingAddress
                    ? `
                <div class="detail-item full-width">
                    <label><i class="fas fa-map-marker-alt"></i> Yetkazib berish manzili</label>
                    <p>${esc(order.shippingAddress)}</p>
                </div>`
                    : ""
                }
                ${
                  order.trackingNumber
                    ? (() => {
                        const cached = this._trackingCache.get(order.id);
                        const liveStatus = cached
                          ? (cached.officeName ? `${cached.statusName} — ${cached.officeName}` : cached.statusName)
                          : (order.shippingStatus ? this._uzpostStatusLabel(order.shippingStatus) : '');
                        return `
                <div class="detail-item full-width">
                    <label><i class="fas fa-truck"></i> Pochta kuzatuv raqami</label>
                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
                      <p style="font-family: monospace; font-size: 1rem; font-weight: 600; margin:0;">${esc(order.trackingNumber)}</p>
                      ${liveStatus ? `<span id="modal-live-status-${order.id}" style="font-size:0.8rem; color:#4ade80; font-family:sans-serif; background:rgba(74,222,128,0.1); padding:2px 8px; border-radius:20px;">${esc(liveStatus)}</span>` : `<span id="modal-live-status-${order.id}" style="font-size:0.8rem; color:#4ade80; font-family:sans-serif; background:rgba(74,222,128,0.1); padding:2px 8px; border-radius:20px; display:none;"></span>`}
                    </div>
                    <button id="tracking-btn-${order.id}" onclick="window._orderTrackFn(${order.id})"
                      style="background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.4); color:#93c5fd; padding:4px 12px; border-radius:20px; cursor:pointer; font-size:12px; display:inline-flex; align-items:center; gap:4px;">
                      <i class="fas fa-map-marker-alt"></i> Batafsil tarix
                    </button>
                    <div id="tracking-detail-${order.id}" style="display:none;"></div>
                </div>`;
                      })()
                    : ""
                }
            </div>

            <div class="detail-section-title">
                <i class="fas fa-box"></i> Buyurtma tarkibi
            </div>

            <div class="order-items-list">
                ${(order.items && Array.isArray(order.items) ? order.items : [])
                  .map(
                    (item) => `
                    <div class="order-item-row">
                        <div class="order-item-info">
                            <span class="order-item-name">${esc(item.product?.title || item.product?.name || "Mahsulot")}</span>
                            <span class="order-item-details">${item.quantity} ta x ${(item.price || 0).toLocaleString()} so'm</span>
                        </div>
                        <span class="order-item-total">${((item.price || 0) * item.quantity).toLocaleString()} so'm</span>
                    </div>
                `,
                  )
                  .join("")}
            </div>

            ${
              (order.status === "PENDING" || order.status === "PAYMENT_WAITING") && !order.paymentConfirmed
                ? `
            <div class="detail-control">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h3 style="margin: 0;">To'lovni amalga oshirish</h3>
                    <p style="font-size: 0.85rem; color: #8b92a7; margin: 0;">Buyurtmangizni tasdiqlash uchun to'lovni amalga oshiring</p>
                </div>
                <div class="detail-actions">
                    <button class="btn-confirm-delivery" id="retryPaymentBtn" onclick="window.retryOrderPayment(${order.id})" style="width: 100%; height: 50px; background: linear-gradient(135deg, #0066ff, #00ccff);">
                        <i class="fas fa-credit-card"></i> To'lovni davom ettirish
                    </button>
                </div>
            </div>`
                : order.status === "DELIVERED"
                ? `
            <div class="detail-control">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h3 style="margin: 0;">Buyurtmani tasdiqlash</h3>
                    <p style="font-size: 0.85rem; color: #8b92a7; margin: 0;">Mahsulotlarni qabul qilib olgan bo'lsangiz, tasdiqlang</p>
                </div>
                <div class="detail-actions">
                    <button class="btn-confirm-delivery" onclick="window.confirmDelivery(${order.id})" style="width: 100%; height: 50px;">
                        <i class="fas fa-check-circle"></i> Buyurtmani qabul qildim
                    </button>
                </div>
            </div>`
                : ""
            }
        `;
  }

  closeModal() {
    const modal = document.getElementById("orderModal");
    if (modal) {
      modal.classList.remove("active");
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    }
    document.body.style.overflow = "";
    this.selectedOrder = null;
  }

  async confirmDelivery(orderId) {
    if (!await showConfirm({ message: "Buyurtmani qabul qildingizmi?" })) return;

    try {
      const { default: api } = await import("../services/api.js");
      await api.patch(`/orders/${orderId}/confirm`);
      await this.loadOrders();
      this.showNotification("Buyurtma qabul qilindi!", "success");
    } catch (error) {
      console.error("Buyurtmani tasdiqlashda xatolik:", error);
      this.showNotification(
        "Xatolik yuz berdi. Qayta urinib ko'ring.",
        "error",
      );
    }
  }

  async retryOrderPayment(orderId) {
    const btn = document.getElementById("retryPaymentBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...';
    }
    try {
      const { default: api } = await import("../services/api.js");
      const { paymentUrl } = await api.get(`/orders/${orderId}/payment-url`);
      if (!paymentUrl) throw new Error("URL olinmadi");
      window.open(paymentUrl, "_blank");
      this.showNotification("Payme sahifasi yangi tabda ochildi. To'lovdan so'ng bu sahifa yangilanadi.", "info");
    } catch (error) {
      console.error("Retry payment error:", error);
      this.showNotification("To'lov URL olishda xatolik. Qaytadan urinib ko'ring.", "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-credit-card"></i> To\'lovni davom ettirish';
      }
    }
  }

  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"}"></i>
            <span>${message}</span>
        `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  destroy() {
    if (this._trackingInterval) {
      clearInterval(this._trackingInterval);
      this._trackingInterval = null;
    }
    window.removeEventListener('robotronix-update', this.onOrderUpdate);
    if (window.confirmDelivery) delete window.confirmDelivery;
    if (window.retryOrderPayment) delete window.retryOrderPayment;
    if (window._orderTrackFn) delete window._orderTrackFn;
    this.closeModal();
  }
}
