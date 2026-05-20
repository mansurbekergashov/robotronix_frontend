function Map() {
  return (
    <div className="container" style={{ width: "100%", height: "100vh" }}>
      <iframe
        src="https://yandex.uz/map-widget/v1/?ll=71.786899%2C40.385765&pt=71.786899%2C40.385765%2Cpm2rdm&z=16"
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "20px" }}
        allowFullScreen=""
        loading="lazy"
      ></iframe>
    </div>
  );
}

export default Map;