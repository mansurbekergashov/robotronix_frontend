function Map() {
  return (
    <div
      className="container"
      style={{ width: "100%", height: "450px", marginBottom: "60px", position: "relative" }}
    >
      <iframe
        src="https://www.openstreetmap.org/export/embed.html?bbox=71.7768%2C40.3757%2C71.7969%2C40.3958&layer=mapnik&marker=40.385765%2C71.786899"
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "20px" }}
        loading="lazy"
        title="Robotronix manzili"
      />
      <a
        href="https://maps.app.goo.gl/zSd9F9inhyMk3KFfA"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Google Maps da yo'l ko'rsatish"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "20px",
          cursor: "pointer",
        }}
      />
    </div>
  );
}

export default Map;
