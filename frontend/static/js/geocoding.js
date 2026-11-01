/* Shared address lookup helpers. Photon returns GeoJSON with [longitude, latitude]. */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SunThreadGeocoding = factory();
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  function addressFields(feature) {
    var p = feature.properties || {};
    var city = p.city || p.town || p.village || p.municipality || "";
    if (!city && p.osm_key === "place" && ["city", "town", "village"].indexOf(p.osm_value) !== -1) city = p.name || "";
    var postcode = String(p.postcode || "").trim();
    var pin = /^\d{6}$/.test(postcode) ? postcode : "";
    var street = [p.housenumber, p.street].filter(Boolean).join(" ");
    var parts = [p.name, street, p.district, p.locality, city, p.state, pin, p.country];
    var seen = new Set();
    var address = parts.filter(function (part) {
      if (!part) return false;
      var key = String(part).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).join(", ");
    return { address: address, city: city, pincode: pin };
  }

  function createClient(baseUrl, fetcher) {
    var cache = new Map();
    var lastRequest = 0;
    var queue = Promise.resolve();
    function request(path, params, signal) {
      if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
      var url = baseUrl.replace(/\/$/, "") + path + "?" + new URLSearchParams(params).toString();
      if (cache.has(url)) return Promise.resolve(cache.get(url));
      // Space requests, including a search followed immediately by a pin lookup.
      var task = queue.catch(function () {}).then(async function () {
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        var wait = Math.max(0, 1000 - (Date.now() - lastRequest));
        if (wait) await new Promise(function (resolve) { setTimeout(resolve, wait); });
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        lastRequest = Date.now();
        var timeout = new AbortController();
        var abort = function () { timeout.abort(); };
        signal.addEventListener("abort", abort, { once: true });
        var timer = setTimeout(abort, 10000);
        try {
          var response = await fetcher(url, {
            signal: timeout.signal, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin",
            headers: { Accept: "application/json" }
          });
          if (!response.ok) throw new Error("Location lookup is unavailable. Try again or choose another map location.");
          var data = await response.json();
          if (!Array.isArray(data.features)) throw new Error("Location lookup returned an invalid response.");
          var features = data.features.filter(function (feature) {
            var c = feature && feature.geometry && feature.geometry.coordinates;
            return feature && feature.geometry && feature.geometry.type === "Point" && Array.isArray(c) && c.length >= 2 &&
              Number.isFinite(c[0]) && Number.isFinite(c[1]) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90;
          });
          if (cache.size >= 50) cache.delete(cache.keys().next().value);
          cache.set(url, features);
          return features;
        } catch (error) {
          if (signal.aborted) throw new DOMException("Aborted", "AbortError");
          throw new Error("Location lookup is unavailable. Try again or choose another map location.");
        } finally {
          clearTimeout(timer);
          signal.removeEventListener("abort", abort);
        }
      });
      queue = task;
      return task;
    }
    return {
      search: function (query, signal) {
        return request("/api/", { q: query, limit: "5", lang: "en" }, signal);
      },
      reverse: function (lat, lng, signal) {
        return request("/reverse", { lat: lat.toFixed(6), lon: lng.toFixed(6), limit: "1", lang: "en" }, signal);
      }
    };
  }
  return { addressFields: addressFields, createClient: createClient };
});
