(() => {
  const meta = document.querySelector('meta[name="analytics-id"]');
  if (!meta) {
    return;
  }

  const measurementId = meta.content.trim();
  if (!measurementId) {
    return;
  }

  const doNotTrack =
    navigator.doNotTrack === "1" || window.doNotTrack === "1";
  if (doNotTrack) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    measurementId
  )}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", measurementId, {
    anonymize_ip: true,
  });
})();
