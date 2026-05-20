function Map() {
  return (
    <div className="container" style={{ width: "100%", height: "100vh" }}>
      <iframe
        src="https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22lat%22%3A40.385765%2C%22lon%22%3A71.786899%2C%22zoom%22%3A16%2C%22firmId%22%3A%22%22%7D"
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "20px" }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allow="fullscreen"
        title="Robotronix manzili"
      ></iframe>
    </div>
  );
}

export default Map;
