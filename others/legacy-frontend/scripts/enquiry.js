/* Customer enquiries choose their installation location through the map. */
(function () {
  "use strict";
  var picker = document.querySelector("[data-location-picker]");
  if (!picker) return;
  var lat = picker.querySelector("[name=site_lat]");
  var lng = picker.querySelector("[name=site_lng]");
  var status = picker.querySelector("[data-location-status]");
  var locate = picker.querySelector("[data-locate]");
  var center = picker.querySelector("[data-map-center]");
  var search = picker.querySelector("[data-place-search]");
  var searchButton = picker.querySelector("[data-place-search-button]");
  var searchStatus = picker.querySelector("[data-search-status]");
  var results = picker.querySelector("[data-place-results]");
  var fields = {
    address: document.querySelector("[name=address]"),
    city: document.querySelector("[name=city]"),
    pincode: document.querySelector("[name=pincode]")
  };
  var summary = picker.querySelector("[data-location-summary]");
  var form = picker.closest("form");
  var submit = form.querySelector("[data-enquiry-submit]");
  var geocoder = SunThreadGeocoding.createClient(picker.getAttribute("data-geocoder-url"), window.fetch.bind(window));
  var lookupController = null, searchController = null, lookupTimer = null;
  var map = null, marker = null, locating = false, selectionVersion = 0;

  function cancelLookup() {
    clearTimeout(lookupTimer);
    if (lookupController) lookupController.abort();
    lookupController = null;
    submit.disabled = false;
  }

  function fallbackAddress() { return "Map location: " + lat.value + ", " + lng.value; }

  function showSummary() {
    summary.hidden = false;
    Object.keys(fields).forEach(function (key) {
      picker.querySelector("[data-" + key + "-preview]").textContent = fields[key].value || "Not available";
    });
    picker.querySelector("[data-coordinates-preview]").textContent = lat.value + ", " + lng.value;
  }

  function fillAddress(feature) {
    var values = SunThreadGeocoding.addressFields(feature);
    Object.keys(fields).forEach(function (key) {
      fields[key].value = values[key];
    });
    fields.address.value = fields.address.value || fallbackAddress();
    showSummary();
    var missing = Object.keys(fields).filter(function (key) { return !fields[key].value; });
    status.textContent = missing.length ? "Location selected. Some address details are unavailable; your map pin will be used." :
      "Location selected. Address, city and pincode filled automatically.";
  }

  function lookupAddress(latitude, longitude) {
    var version = selectionVersion;
    lookupController = new AbortController();
    var controller = lookupController;
    submit.disabled = true;
    status.textContent = "Finding the address for your selected location…";
    // Moving the pin quickly only looks up its final position.
    lookupTimer = setTimeout(function () {
      geocoder.reverse(latitude, longitude, controller.signal).then(function (features) {
        if (version !== selectionVersion) return;
        if (!features.length) throw new Error("Address details are unavailable. Your map pin will be used.");
        fillAddress(features[0]);
      }).catch(function (error) {
        if (version === selectionVersion && error.name !== "AbortError") {
          status.textContent = "Location selected. Your map pin will be used; address details could not be loaded.";
        }
      }).finally(function () {
        if (version === selectionVersion) { submit.disabled = false; lookupController = null; }
      });
    }, 500);
  }

  function select(latitude, longitude, feature, restoring) {
    selectionVersion += 1;
    cancelLookup();
    if (searchController) { searchController.abort(); searchController = null; searchButton.disabled = false; }
    results.hidden = true;
    lat.value = latitude.toFixed(6);
    lng.value = longitude.toFixed(6);
    if (!restoring) {
      fields.address.value = fallbackAddress();
      fields.city.value = fields.pincode.value = "";
    } else if (!fields.address.value) fields.address.value = fallbackAddress();
    showSummary();
    status.textContent = "Location selected: " + lat.value + ", " + lng.value + ".";
    if (map) {
      if (marker) marker.setLatLng([latitude, longitude]);
      else {
        marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
        marker.on("dragend", function () {
          var point = marker.getLatLng().wrap();
          select(point.lat, point.lng);
        });
      }
    }
    if (restoring) return;
    if (feature) fillAddress(feature);
    if (!feature || !fields.city.value || !fields.pincode.value) lookupAddress(latitude, longitude);
  }

  function clearResults() {
    results.replaceChildren();
    results.hidden = true;
    if (searchController) searchController.abort();
    searchController = null;
    searchButton.disabled = false;
  }

  function searchPlaces() {
    clearResults();
    var query = search.value.trim();
    if (query.length < 3) { searchStatus.textContent = "Enter at least 3 characters to search."; return; }
    var controller = new AbortController();
    searchController = controller;
    searchButton.disabled = true;
    searchStatus.textContent = "Searching for places…";
    geocoder.search(query, controller.signal).then(function (features) {
      if (controller.signal.aborted) return;
      searchStatus.textContent = features.length ? "Choose a result to select its location and fill the address." :
        "No places found. Try adding a city or pincode, or select a point on the map.";
      features.forEach(function (feature) {
        var item = document.createElement("li");
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = SunThreadGeocoding.addressFields(feature).address || "Select location";
        button.addEventListener("click", function () {
          var coordinates = feature.geometry.coordinates;
          select(coordinates[1], coordinates[0], feature);
          if (map) map.setView([coordinates[1], coordinates[0]], 17);
          searchStatus.textContent = "Location selected. You can refine it by moving the pin.";
        });
        item.appendChild(button);
        results.appendChild(item);
      });
      results.hidden = !features.length;
    }).catch(function (error) {
      if (error.name !== "AbortError") searchStatus.textContent = error.message;
    }).finally(function () {
      if (searchController === controller) { searchController = null; searchButton.disabled = false; }
    });
  }
  searchButton.addEventListener("click", searchPlaces);
  search.addEventListener("keydown", function (event) {
    if (event.key === "Enter") { event.preventDefault(); searchPlaces(); }
  });
  search.addEventListener("input", function () { clearResults(); searchStatus.textContent = ""; });
  form.addEventListener("submit", function (event) {
    if (!lat.value || !lng.value || !Number.isFinite(Number(lat.value)) || !Number.isFinite(Number(lng.value)) ||
        Math.abs(Number(lat.value)) > 90 || Math.abs(Number(lng.value)) > 180) {
      event.preventDefault();
      status.textContent = "Choose your installation location on the map before sending your enquiry.";
      search.focus();
    }
  });

  if (window.L) {
    map = L.map("site-map", { scrollWheelZoom: false }).setView([12.9716, 77.5946], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      // Django defaults to same-origin; OSM requires the requesting site's origin.
      referrerPolicy: "strict-origin-when-cross-origin",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map).on("tileerror", function () {
      if (!lat.value) status.textContent = "Map tiles could not load. Search for a place or use your current location.";
    });
    map.on("click", function (event) {
      select(event.latlng.lat, event.latlng.wrap().lng);
    });
    status.textContent = "No pin selected. Tap the map or use your current location.";
  } else {
    center.disabled = true;
    status.textContent = "Map unavailable. Search for a place or use your current location to select a pin.";
  }

  var savedLat = Number(lat.value), savedLng = Number(lng.value);
  if (lat.value && lng.value && Number.isFinite(savedLat) && Number.isFinite(savedLng) && Math.abs(savedLat) <= 90 && Math.abs(savedLng) <= 180) {
    select(savedLat, savedLng, null, true);
    if (map) map.setView([savedLat, savedLng], 17);
  }

  center.addEventListener("click", function () {
    if (!map) return;
    var point = map.getCenter().wrap();
    select(point.lat, point.lng);
  });
  picker.querySelector("[data-clear-location]").addEventListener("click", function () {
    selectionVersion += 1;
    cancelLookup();
    clearResults();
    searchStatus.textContent = "";
    lat.value = lng.value = "";
    Object.keys(fields).forEach(function (key) { fields[key].value = ""; });
    summary.hidden = true;
    if (marker) { marker.remove(); marker = null; }
    status.textContent = "Location cleared. Choose your installation location on the map.";
  });
  locate.addEventListener("click", function () {
    if (!navigator.geolocation) {
      status.textContent = "Location is not available on this device. Search for a place or select a map pin.";
      return;
    }
    if (locating) return;
    locating = true;
    locate.disabled = true;
    var version = selectionVersion;
    status.textContent = "Finding your location…";
    function done() { locating = false; locate.disabled = false; }
    navigator.geolocation.getCurrentPosition(function (position) {
      done();
      if (version !== selectionVersion) return;
      select(position.coords.latitude, position.coords.longitude);
      if (map) map.setView([position.coords.latitude, position.coords.longitude], 18);
    }, function () {
      done();
      if (version === selectionVersion) status.textContent = "Could not get your location. Allow location access, search for a place, or select a map pin.";
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  });
})();
