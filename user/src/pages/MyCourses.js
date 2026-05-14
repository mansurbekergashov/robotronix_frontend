import { API_BASE_URL, getFileUrl } from "../config.js";

export default class MyCourses {
  constructor() {
    this.container = document.getElementById("main-content");
    this.enrollments = [];
    this.loading = true;
    this.onEnrollmentUpdate = (event) => {
      const update = event.detail;
      if (update && (update.entityType === 'ENROLLMENT' || update.entityType === 'COURSE')) {
        this.loadData();
      }
    };
  }

  async render() {
    this.container.innerHTML = `
            <div class="page-header">
                <div class="header-content">
                    <div>
                        <h1><i class="fas fa-graduation-cap"></i> Mening Kurslarim</h1>
                        <p>Siz yozilgan va o'qiyotgan kurslar</p>
                    </div>
                </div>
            </div>

            <div class="my-courses-container">
                <div class="my-courses-list" id="enrollmentsList">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Ma'lumotlar yuklanmoqda...</p>
                    </div>
                </div>
            </div>
        `;

    await this.loadData();

    // Listen for global real-time notifications from sync service
    window.addEventListener("robotronix-update", this.onEnrollmentUpdate);
  }

  async loadData() {
    try {
      const { default: api } = await import("../services/api.js");
      this.enrollments = await api.get("/courses/my-enrollments");



      this.loading = false;
      this.renderEnrollments();
    } catch (error) {
      console.error("Kurslarni yuklashda xatolik:", error);
      document.getElementById("enrollmentsList").innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Ma'lumotlarni yuklashda xatolik yuz berdi</p>
                    <button class="btn-primary" onclick="location.reload()">Qayta urinish</button>
                </div>
            `;
    }
  }

  getStatusInfo(status) {
    const statusMap = {
      PENDING: { class: "pending", text: "Ariza kutilmoqda", icon: "fa-clock" },
      CONFIRMED: {
        class: "active",
        text: "O'qishda",
        icon: "fa-graduation-cap",
      },
      REJECTED: {
        class: "rejected",
        text: "Rad etilgan",
        icon: "fa-times-circle",
      },
      COMPLETED: {
        class: "completed",
        text: "Tugallangan",
        icon: "fa-certificate",
      },
    };
    return (
      statusMap[status] || {
        class: "info",
        text: status,
        icon: "fa-info-circle",
      }
    );
  }

  renderEnrollments() {
    const list = document.getElementById("enrollmentsList");

    if (!this.enrollments || this.enrollments.length === 0) {
      console.warn("⚠️  MyCourses - No enrollments found");
      list.innerHTML = `
                <div class="cart-empty-state">
                    <div class="empty-icon-wrapper">
                        <i class="fas fa-graduation-cap"></i>
                        <div class="icon-pulse"></div>
                    </div>
                    <h2>Kurslar topilmadi</h2>
                    <p>Siz hali hech qanday kursga yozilmagansiz. Bizning kurslarimiz bilan tanishib ko'ring.</p>
                    <a href="#courses" class="btn-primary btn-large">
                        <i class="fas fa-plus"></i> Kurslarni ko'rish
                    </a>
                </div>
            `;
      return;
    }

    list.innerHTML = `
            <div class="my-courses-grid">
                ${this.enrollments
                  .map((enrollment, index) => {
                    const course = enrollment.course;
                    if (!course) {
                      console.warn(
                        "⚠️  MyCourses - Enrollment",
                        index,
                        "has no course:",
                        enrollment,
                      );
                      return "";
                    }
                    const status = this.getStatusInfo(enrollment.status);
                    const date = new Date(
                      enrollment.createdAt ||
                        enrollment.enrolledAt ||
                        Date.now(),
                    ).toLocaleDateString("uz-UZ", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });

                    const imageUrl = getFileUrl(course.imageUrl);

                    return `
                        <div class="enrollment-card">
                            <div class="enrollment-badge status-${status.class}">
                                <i class="fas ${status.icon}"></i> ${status.text}
                            </div>

                            <div class="enrollment-image" style="position: relative;">
                                <img src="${imageUrl}" alt="${course.title}">
                                <div style="position: absolute; bottom: 0.5rem; left: 0.5rem; background: ${course.isOnline ? "var(--success, #22c55e)" : "var(--warning, #f59e0b)"}; border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; font-weight: 600; color: white; display: flex; align-items: center; gap: 4px; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                    <i class="fas ${course.isOnline ? "fa-globe" : "fa-building"}"></i> ${course.isOnline ? "Online" : "Oflayn"}
                                </div>
                            </div>

                            <div class="enrollment-content">
                                <h3 class="course-title">${course.title}</h3>

                                <div class="course-meta-grid">
                                    <div class="meta-pill">
                                        <i class="fas fa-calendar-alt"></i>
                                        <span>${date}</span>
                                    </div>
                                    <div class="meta-pill">
                                        <i class="fas fa-clock"></i>
                                        <span>${course.duration || "Noma'lum"}</span>
                                    </div>
                                </div>

                                <div class="enrollment-footer">
                                    <div class="course-price">
                                        <span class="price-amount">${(course.price || 0).toLocaleString()}</span>
                                        <span class="price-currency">so'm</span>
                                    </div>

                                    <div class="course-actions">
                                        ${
                                          enrollment.status === "CONFIRMED"
                                            ? course.isOnline
                                              ? `
                                                <a href="${course.telegramUrl || "#"}" target="_blank" rel="noopener noreferrer" class="btn-start-course" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">
                                                    <span>Darsni boshlash</span>
                                                    <i class="fas fa-arrow-right"></i>
                                                </a>
                                            `
                                              : `
                                                <div class="lock-indicator" style="color: var(--text-secondary); background: rgba(255,255,255,0.05);">
                                                    <i class="fas fa-info-circle"></i>
                                                    <span>Faqat markazda</span>
                                                </div>
                                            `
                                            : `
                                            <div class="lock-indicator ${enrollment.status === "PENDING" ? "pending" : ""}">
                                                <i class="fas ${enrollment.status === "PENDING" ? "fa-hourglass-half" : "fa-lock"}"></i>
                                                <span>${enrollment.status === "PENDING" ? "Tasdiq kutilmoqda" : "Yopiq"}</span>
                                            </div>
                                        `
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                  })
                  .join("")}
            </div>
        `;
  }

  destroy() {
    window.removeEventListener("robotronix-update", this.onEnrollmentUpdate);
  }
}
