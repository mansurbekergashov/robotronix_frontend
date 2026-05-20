function Map() {
  return (
    <div className="container" style={{ width: "100%", height: "100vh" }}>
      <iframe
        src="https://www.google.com/maps?q=40.385765,71.786899&z=16&output=embed"
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "20px" }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Robotronix manzili"
      ></iframe>
    </div>
  );
}

export default Map;
