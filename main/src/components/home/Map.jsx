function Map() {
  return (
    <div className="container" style={{ width: "100%", height: "100vh" }}>
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d872.7125663611365!2d71.7878036087784!3d40.38602238757492!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38bb83006304c309%3A0xe8957111cfa65ff5!2sROBOTRONIX%20(Robototexnika)!5e1!3m2!1sru!2s!4v1779205843466!5m2!1sru!2s" 
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "20px" }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  );
}

export default Map;