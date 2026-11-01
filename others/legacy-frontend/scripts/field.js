/* Field tools: photo upload with client-side compression, signature pad, step wizard, geotag.
   Built for a technician's phone: big tap targets, no external libraries. */
(function () {
  "use strict";

  // ---------- photo uploader -------------------------------------------------
  function compress(file, maxDim, quality) {
    return new Promise(function (resolve) {
      if (!file.type || !file.type.startsWith("image/") || file.type === "image/svg+xml") return resolve(file);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, maxDim / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        if (c.toBlob) {
          c.toBlob(function (b) { resolve(b || file); }, "image/jpeg", quality);
        } else {
          resolve(file);
        }
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  document.querySelectorAll("[data-uploader]").forEach(function (box) {
    var counter = document.querySelector("[data-photo-count]");
    box.querySelectorAll(".upload-tile").forEach(function (tile) {
      var input = tile.querySelector("input[type=file]");
      if (!input) return;
      input.addEventListener("change", function () {
        var files = Array.prototype.slice.call(input.files);
        input.value = "";
        files.forEach(function (f) {
          tile.classList.add("busy");
          compress(f, 1600, 0.8).then(function (blob) {
            var fd = new FormData();
            fd.append("file", blob, "photo.jpg");
            fd.append("target", box.getAttribute("data-target") || "");
            fd.append("id", box.getAttribute("data-id") || "");
            fd.append("kind", tile.getAttribute("data-kind") || "");
            return fetch(box.getAttribute("data-url"), {
              method: "POST", body: fd, credentials: "same-origin",
              headers: { "X-CSRFToken": box.getAttribute("data-csrf") || "" }
            });
          }).then(function (r) { return r.json(); }).then(function (j) {
            if (!j.ok) throw new Error(j.error || "Upload failed");
            var t = document.createElement("div");
            t.className = "thumb";
            t.innerHTML = '<img alt=""><span class="k"></span>';
            t.querySelector("img").src = j.url;
            t.querySelector(".k").textContent = j.kind || "photo";
            box.insertBefore(t, box.querySelector(".upload-tile"));
            if (counter) counter.textContent = parseInt(counter.textContent || "0", 10) + 1;
          }).catch(function (err) { alert(err.message || "Upload failed. Try again."); })
            .then(function () { tile.classList.remove("busy"); });
        });
      });
    });
  });

  // ---------- signature pad --------------------------------------------------
  document.querySelectorAll("[data-sigpad]").forEach(function (wrap) {
    var canvas = wrap.querySelector("canvas");
    if (!canvas) return;
    canvas.style.touchAction = "none";
    var field = wrap.querySelector("input[type=hidden]");
    var ctx = canvas.getContext("2d");
    var drawing = false, drew = false;

    function resize() {
      var w = canvas.clientWidth || (wrap.clientWidth ? wrap.clientWidth - 4 : 0);
      var h = canvas.clientHeight || 190;
      if (!w) return; // parent is hidden (e.g. inactive wizard step); wait for step visibility
      var ratio = window.devicePixelRatio || 1;
      var keep = drew ? canvas.toDataURL() : null;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0f172a";
      if (keep) {
        var im = new Image();
        im.onload = function () { ctx.drawImage(im, 0, 0, w, h); };
        im.src = keep;
      }
    }
    function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    canvas.addEventListener("pointerdown", function (e) {
      if (!canvas.width || canvas.clientWidth !== (canvas.width / (window.devicePixelRatio || 1))) {
        resize();
      }
      drawing = true;
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
      var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) { if (!drawing) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); drew = true; });
    function end() { if (!drawing) return; drawing = false; if (drew && field) field.value = canvas.toDataURL("image/png"); }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    var clear = wrap.querySelector("[data-sig-clear]");
    if (clear) clear.addEventListener("click", function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drew = false;
      if (field) field.value = "";
    });
    resize();
    window.addEventListener("resize", resize);
  });

  // ---------- step wizard ----------------------------------------------------
  document.querySelectorAll("[data-wizard]").forEach(function (wiz) {
    var steps = Array.prototype.slice.call(wiz.querySelectorAll(".step"));
    var heads = Array.prototype.slice.call(wiz.querySelectorAll(".wiz-head span"));
    var at = 0;
    function show(i) {
      at = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) { s.classList.toggle("active", k === at); });
      heads.forEach(function (h, k) { h.classList.toggle("active", k === at); h.classList.toggle("done", k < at); });
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.dispatchEvent(new Event("resize"));
    }
    wiz.addEventListener("click", function (e) {
      if (e.target.closest("[data-next]")) { e.preventDefault(); show(at + 1); }
      if (e.target.closest("[data-prev]")) { e.preventDefault(); show(at - 1); }
    });
    var firstError = wiz.getAttribute("data-start");
    show(firstError ? parseInt(firstError, 10) : 0);
  });

  // ---------- geotag (optional, fail-soft) -----------------------------------
  document.querySelectorAll("[data-geo]").forEach(function (btn) {
    var out = document.querySelector("[data-geo-out]");
    btn.addEventListener("click", function () {
      if (!navigator.geolocation) { if (out) out.textContent = "Location is not available on this device."; return; }
      if (out) out.textContent = "Locating…";
      navigator.geolocation.getCurrentPosition(function (p) {
        var lat = document.querySelector("[name=geo_lat]");
        var lng = document.querySelector("[name=geo_lng]");
        if (lat) lat.value = p.coords.latitude.toFixed(6);
        if (lng) lng.value = p.coords.longitude.toFixed(6);
        if (out) out.textContent = "Location captured (" + p.coords.latitude.toFixed(4) + ", " + p.coords.longitude.toFixed(4) + ")";
      }, function (err) {
        if (out) out.textContent = "Could not get location. You can still submit.";
      }, { timeout: 10000, enableHighAccuracy: true });
    });
  });
})();
