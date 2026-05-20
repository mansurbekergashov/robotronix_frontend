import { useState, useEffect } from "react";

export default function SocialModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (

    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={{display: "flex", justifyContent: "end"}}>
          <button onClick={() => setShow(false)} style={styles.closeBtn}>
            <p>✖</p>
          </button>
        </div>
        <h2 className="social-title" style={{ marginBottom: "10px" }}>Bizni Instagram va Telegramda ham kuzatib boring</h2>

        <p className="social-text" style={{ marginBottom: "20px", color: "var(--text-secondary)" }}>
          Eng so‘nggi yangiliklar va tizim haqidagi muhim ma'lumotlar va o'quv kurslari haqidagi ma'lumotlardan xabardor bo'ling
        </p>
        <div className="social-buttons" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <a
              href="https://t.me/Robotronix_LLC"
              target="_blank"
              style={styles.telegram}
            >
            <i class="fa-brands fa-telegram" style={{display: "inline-block"}}></i> <br />
              <p>Telegram</p>
            </a>

            <a
              href="https://instagram.com/robotronixuz"
              target="_blank"
              style={styles.instagram}
            >
            <i class="fa-brands fa-instagram" style={{display: "inline-block"}}></i> <br />
              <p>Instagram</p>
            </a>
        </div>
      </div>
    </div> 
  ); 
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  modal: {
    background: "var(--card-bg)",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    maxWidth: "450px",
    width: "100%",
  },

  telegram: {
    display: "inline-block",
    width: "150px",
    background: "#0088cc",
    color: "white",
    padding: "10px 10px",
    borderRadius: "8px",
    textDecoration: "none",
  },

  instagram: {
    display: "inline-block",
    width: "150px",
    background: "linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7)",
    color: "white",
    padding: "10px 10px",
    borderRadius: "8px",
    textDecoration: "none",
  },

  closeBtn: {
    background: "transparent",
    border: "var(--border-color) 1px solid",
    marginTop: "0",
    color: "var(--text-primary)",
    opacity: 0.6,
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },



  
};  
