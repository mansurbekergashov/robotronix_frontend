function Map() {
  return (
    <div className="container" style={{ width: "100%", height: "450px" }}>
      <iframe
        src="https://www.openstreetmap.org/export/embed.html?bbox=71.7768%2C40.3757%2C71.7969%2C40.3958&layer=mapnik&marker=40.385765%2C71.786899"
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "20px" }}
        allowFullScreen=""
        loading="lazy"
        title="Robotronix manzili"
      ></iframe>
    </div>
  );
}

export default Map;
