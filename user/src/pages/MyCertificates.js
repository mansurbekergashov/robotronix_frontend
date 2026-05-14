import { API_BASE_URL, getFileUrl } from "../config.js";

export default class MyCertificates {
  constructor() {
    this.container = document.getElementById("main-content");
    this.certificates = [];
    this.loading = true;
    this.selectedCert = null;
  }

  async render() {
    this.container.innerHTML = `
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1><i class="fas fa-certificate"></i> Sertifikatlarim</h1>
            <p>Sizga berilgan sertifikatlar ro'yxati</p>
          </div>
        </div>
      </div>

      <div class="certificates-container">
        <div class="certificates-list" id="certificatesList">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Ma'lumotlar yuklanmoqda...</p>
          </div>
        </div>
      </div>

      <!-- Certificate Preview Modal -->
      <div class="cert-preview-modal" id="certPreviewModal" style="display: none;">
        <div class="cert-preview-overlay" id="certPreviewOverlay"></div>
        <div class="cert-preview-content">
          <div class="cert-preview-header">
            <h2 id="certPreviewTitle">Sertifikat</h2>
            <button class="cert-preview-close" id="certPreviewClose">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="cert-preview-body" id="certPreviewBody"></div>
          <div class="cert-preview-footer">
            <a id="certDownloadLink" class="btn-download-cert" download>
              <i class="fas fa-download"></i> Yuklab olish
            </a>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
    this.attachModalEvents();
  }

  async loadData() {
    try {
      const { default: api } = await import("../services/api.js");
      this.certificates = await api.get("/profile/certificates");
      this.loading = false;
      this.renderCertificates();
    } catch (error) {
      console.error("Sertifikatlarni yuklashda xatolik:", error);
      document.getElementById("certificatesList").innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Ma'lumotlarni yuklashda xatolik yuz berdi</p>
          <button class="btn-primary btn-large" onclick="location.reload()">Qayta urinish</button>
        </div>
      `;
    }
  }

  getFileFullUrl(fileUrl) {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    // For uploaded files
    if (fileUrl.startsWith('/uploads') || fileUrl.startsWith('uploads')) {
      const cleanPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
      return `${API_BASE_URL}${cleanPath}`;
    }
    return `${API_BASE_URL}${fileUrl}`;
  }

  isPdf(fileUrl) {
    if (!fileUrl) return false;
    return fileUrl.toLowerCase().endsWith('.pdf');
  }

  renderCertificates() {
    const list = document.getElementById("certificatesList");

    if (!this.certificates || this.certificates.length === 0) {
      list.innerHTML = `
        <div class="cart-empty-state">
          <div class="empty-icon-wrapper">
            <i class="fas fa-certificate"></i>
            <div class="icon-pulse"></div>
          </div>
          <h2>Sertifikatlar topilmadi</h2>
          <p>Sizga hali sertifikat berilmagan. Kursni muvaffaqiyatli tugatganingizdan so'ng, sertifikat beriladi.</p>
          <a href="#my-courses" class="btn-primary btn-large">
            <i class="fas fa-graduation-cap"></i> Kurslarimga o'tish
          </a>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <div class="my-certs-grid">
        ${this.certificates
          .map((cert, index) => {
            const issuedDate = cert.issuedAt
              ? new Date(cert.issuedAt).toLocaleDateString("uz-UZ", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Noma'lum";
            const fileUrl = this.getFileFullUrl(cert.fileUrl);
            const isPdf = this.isPdf(cert.fileUrl);

            return `
              <div class="my-cert-card" data-index="${index}">
                <div class="my-cert-preview-area">
                  ${
                    isPdf
                      ? `<div class="my-cert-pdf-icon">
                           <i class="fas fa-file-pdf"></i>
                           <span>PDF Sertifikat</span>
                         </div>`
                      : `<img src="${fileUrl}" alt="Sertifikat" class="my-cert-image" onerror="this.parentElement.innerHTML='<div class=\\'my-cert-pdf-icon\\'><i class=\\'fas fa-certificate\\'></i><span>Sertifikat</span></div>'">`
                  }
                  <div class="my-cert-overlay">
                    <button class="btn-cert-preview" data-index="${index}">
                      <i class="fas fa-eye"></i> Ko'rish
                    </button>
                  </div>
                </div>
                <div class="my-cert-info">
                  <div class="my-cert-course">
                    <i class="fas fa-book"></i>
                    <span>${cert.courseTitle || "Kurs nomi mavjud emas"}</span>
                  </div>
                  <div class="my-cert-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Berilgan: ${issuedDate}</span>
                  </div>
                  <div class="my-cert-actions">
                    <button class="btn-cert-preview-sm" data-index="${index}">
                      <i class="fas fa-eye"></i> Ko'rish
                    </button>
                    <a href="${fileUrl}" download class="btn-cert-download" target="_blank">
                      <i class="fas fa-download"></i> Yuklab olish
                    </a>
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    // Attach preview click events
    document.querySelectorAll(".btn-cert-preview, .btn-cert-preview-sm").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this.openPreview(index);
      });
    });
  }

  openPreview(index) {
    const cert = this.certificates[index];
    if (!cert) return;

    const modal = document.getElementById("certPreviewModal");
    const title = document.getElementById("certPreviewTitle");
    const body = document.getElementById("certPreviewBody");
    const downloadLink = document.getElementById("certDownloadLink");
    const fileUrl = this.getFileFullUrl(cert.fileUrl);
    const isPdf = this.isPdf(cert.fileUrl);

    title.textContent = cert.courseTitle || "Sertifikat";

    if (isPdf) {
      body.innerHTML = `
        <iframe src="${fileUrl}" class="cert-pdf-viewer" title="Sertifikat"></iframe>
      `;
    } else {
      body.innerHTML = `
        <img src="${fileUrl}" alt="Sertifikat" class="cert-full-image">
      `;
    }

    downloadLink.href = fileUrl;
    downloadLink.setAttribute("target", "_blank");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  closePreview() {
    const modal = document.getElementById("certPreviewModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  attachModalEvents() {
    const overlay = document.getElementById("certPreviewOverlay");
    const closeBtn = document.getElementById("certPreviewClose");

    if (overlay) {
      overlay.addEventListener("click", () => this.closePreview());
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closePreview());
    }

    // ESC key to close
    this._escHandler = (e) => {
      if (e.key === "Escape") this.closePreview();
    };
    document.addEventListener("keydown", this._escHandler);
  }

  destroy() {
    if (this._escHandler) {
      document.removeEventListener("keydown", this._escHandler);
    }
  }
}
