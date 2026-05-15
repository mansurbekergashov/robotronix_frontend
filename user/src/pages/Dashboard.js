// Dashboard Page
export default class Dashboard {
  constructor() {
    this.container = document.getElementById("main-content");
    this.onEnrollmentUpdate = (event) => {
      const update = event.detail;
      if (update && (update.entityType === 'ENROLLMENT' || update.entityType === 'COURSE' || update.entityType === 'ORDER')) {
        this.loadData();
      }
    };
  }

  render() {
    this.container.innerHTML = this.getHTML();
    this.loadData();

    // Listen for global real-time notifications
    window.addEventListener("robotronix-update", this.onEnrollmentUpdate);
  }

  getHTML() {
    return `
            <div class="page-header">
                <h1>Dashboard</h1>
                <p>Xush kelibsiz!</p>
            </div>


            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #0066ff 0%, #00ccff 100%);">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="coursesCount">0</h3>
                        <p>Faol kurslar</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
                        <i class="fas fa-certificate"></i>
                    </div>
                    <div class="stat-info">
                        <h3>5</h3>
                        <p>Sertifikatlar</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="cartCount">0</h3>
                        <p>Savatda</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #ef5350 0%, #f87171 100%);">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="ordersCount">0</h3>
                        <p>Buyurtmalar</p>
                    </div>
                </div>
            </div>

            <div class="content-grid">
                <div class="content-card">
                    <div class="card-header">
                        <h2>Faol Kurslar</h2>
                        <a href="#my-courses" class="view-all">Barchasini ko'rish <i class="fas fa-arrow-right"></i></a>
                    </div>
                    <div class="course-list" id="coursesList">
                        <div class="loading">Yuklanmoqda...</div>
                    </div>
                </div>

                <div class="content-card">
                    <div class="card-header">
                        <h2>So'nggi Buyurtmalar</h2>
                        <a href="#orders" class="view-all">Barchasini ko'rish <i class="fas fa-arrow-right"></i></a>
                    </div>
                    <div class="order-list" id="ordersList">
                        <div class="loading">Yuklanmoqda...</div>
                    </div>
                </div>
            </div>
        `;
  }

  async loadData() {
    try {
      const { default: api } = await import("../services/api.js");
      const { API_BASE_URL } = await import("../config.js");
      this.API_BASE_URL = API_BASE_URL;

      // Fetch data in parallel
      const [enrollments, orders] = await Promise.all([
        api.get("/courses/my-enrollments").catch(() => []),
        api.get("/orders/my").catch(() => []),
      ]);


      this.renderCourses(enrollments || []);
      this.renderOrders(orders || []);
      this.updateStats(enrollments || [], orders || []);
    } catch (error) {
      console.error("Ma'lumotlarni yuklashda xatolik: ", error);
      document.getElementById("coursesList").innerHTML =
        `<div class="error-message">Ma'lumotlarni yuklashda xatolik yuz berdi</div>`;
      document.getElementById("ordersList").innerHTML =
        `<div class="error-message">Ma'lumotlarni yuklashda xatolik yuz berdi</div>`;
    }
  }

  renderCourses(enrollments) {
    const coursesList = document.getElementById("coursesList");

    // Faqat tasdiqlangan (CONFIRMED) yoki tugallangan (COMPLETED) kurslarni ko'rsatish
    const activeEnrollments = enrollments.filter(
      (e) => e.status === "CONFIRMED" || e.status === "COMPLETED",
    );

    if (!activeEnrollments || activeEnrollments.length === 0) {
      coursesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <p>Faol kurslar mavjud emas</p>
                </div>
            `;
      return;
    }

    coursesList.innerHTML = activeEnrollments
      .slice(0, 3)
      .map((enrollment) => {
        const course = enrollment.course;
        if (!course) return "";

        return `
                <div class="course-item">
                    <div class="course-icon">
                        <i class="fas ${course.isOnline ? "fa-globe" : "fa-building"}"></i>
                    </div>
                    <div class="course-details">
                        <h4>${course.title}</h4>
                        <p>${course.category || "Robototexnika"}</p>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${enrollment.status === "COMPLETED" ? "100%" : "20%"}"></div>
                        </div>
                        <span class="progress-text">${enrollment.status === "COMPLETED" ? "100% tugallangan" : "Jarayonda"}</span>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  getStatusInfo(status) {
    const statusMap = {
      PENDING:         { class: "warning",   text: "To'lov kutilmoqda" },
      PAYMENT_WAITING: { class: "warning",   text: "To'lov kutilmoqda" },
      CONFIRMED:       { class: "info",      text: "Tasdiqlandi" },
      PREPARING:       { class: "primary",   text: "Tayyorlanmoqda" },
      SHIPPED:         { class: "secondary", text: "Yo'lda" },
      DELIVERED:       { class: "delivered", text: "Yetkazildi" },
      RECEIVED:        { class: "success",   text: "Qabul qilindi" },
      CANCELLED:       { class: "danger",    text: "Bekor qilindi" },
    };
    return statusMap[status] || { class: "secondary", text: status };
  }

  renderOrders(orders) {
    const ordersList = document.getElementById("ordersList");

    if (!orders || orders.length === 0) {
      ordersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Buyurtmalar mavjud emas</p>
                </div>
            `;
      return;
    }

    ordersList.innerHTML = orders
      .slice(0, 3)
      .map((order) => {
        const status = this.getStatusInfo(order.status);
        const date = new Date(order.createdAt).toLocaleDateString("uz-UZ", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        const items =
          order.items && Array.isArray(order.items) ? order.items : [];
        const firstItemName =
          items.length > 0 && items[0] && items[0].product
            ? items[0].product.title
            : "Mahsulot";
        const itemsText =
          items.length > 1
            ? `${firstItemName} va yana ${items.length - 1} ta`
            : firstItemName;

        return `
                <div class="order-item">
                    <div class="order-info">
                        <h4>${itemsText}</h4>
                        <p>Buyurtma #${order.id}</p>
                    </div>
                    <div class="order-status">
                        <span class="badge badge-${status.class}">${status.text}</span>
                        <p class="order-date">${date}</p>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  updateStats(enrollments, orders) {
    // Faol kurslar
    const activeCourses = enrollments.filter(
      (e) => e.status === "CONFIRMED" || e.status === "COMPLETED",
    ).length;
    // Tugallangan kurslar (sertifikat uchun)
    const completedCourses = enrollments.filter(
      (e) => e.status === "COMPLETED",
    ).length;

    document.getElementById("coursesCount").textContent = activeCourses;

    // Bizda alohida sertifikat moduli bo'lmasa, uni vaqtincha completed courses bilan bog'laymiz
    const certificateEl = document.querySelector(".stat-card:nth-child(2) h3");
    if (certificateEl) {
      certificateEl.textContent = completedCourses;
    }

    document.getElementById("ordersCount").textContent = orders.length;

    const cart = JSON.parse(localStorage.getItem("userCart") || "[]");
    document.getElementById("cartCount").textContent = cart.length;
  }

  destroy() {
    window.removeEventListener("robotronix-update", this.onEnrollmentUpdate);
  }
}

