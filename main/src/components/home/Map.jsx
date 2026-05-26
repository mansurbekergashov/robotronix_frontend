import { useState } from "react";

function Map() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: "20px", position: "relative"}}>
      <iframe
        src="https://yandex.uz/map-widget/v1/?ll=71.786826%2C40.385732&z=17&oid=84108716451&ol=biz"
        width="100%"
        height="280px"
        style={{ border: 0, borderRadius: "20px", display: "block" }}
        loading="lazy"
        title="Robotronix manzili"
        allowFullScreen
      />

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Manzil ma'lumotlarini ko'rsatish"
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          border: "none",
          background: open ? "#33cccc" : "#fff",
          color: open ? "#fff" : "#33cccc",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          cursor: "pointer",
          fontSize: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          transition: "background 0.2s, color 0.2s",
        }}
      >
        <i className="fas fa-info" />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "72px",
            right: "16px",
            width: "300px",
            maxWidth: "calc(100% - 32px)",
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            zIndex: 2,
            color: "var(--primary-color)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <h4 style={{ margin: 0, fontSize: "15px", color: "var(--primary-color)" }}>Robotronix</h4>
            <button
              onClick={() => setOpen(false)}
              aria-label="Yopish"
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: "16px",
                padding: 0,
                lineHeight: 1,
              }}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", marginBottom: "10px" }}>
            <i className="fas fa-map-marker-alt" style={{ color: "#33cccc", marginTop: "3px" }} />
            <span>Farg'ona, Ma'rifat ko'chasi, 21B</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", marginBottom: "14px" }}>
            <i className="fas fa-phone" style={{ color: "#33cccc" }} />
            <a href="tel:+998338033353" style={{ color: "var(--primary-color)", textDecoration: "none" }}>
              +998 33 803 33 53
            </a>
          </div>

          <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "8px" }}>
            Yo'l ko'rsatish:
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <a
              href="https://yandex.uz/maps/?rtext=~40.385765%2C71.786899&rtt=auto"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "#ffcc00",
                color: "#000",
                padding: "8px 10px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <i className="fas fa-map" />
              Yandex
            </a>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=40.385765,71.786899"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "#4285f4",
                color: "#fff",
                padding: "8px 10px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <i className="fab fa-google" />
              Google
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;
