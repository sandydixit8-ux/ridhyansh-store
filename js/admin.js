seedIfEmpty();

var s = sett();

function $(id) { return document.getElementById(id); }

if (!authOk()) {
  location.href = "login.html";
} else {
  init();
}

function init() {
  document.title = s.shopName + " — Admin";
  $("brand").textContent = s.shopName;
  $("verBadge").textContent = "ver6";

  $("shopName").value = s.shopName || "";
  $("user").value = s.rh_user || "";
  $("upiId").value = s.upiId || "";
  $("whatsapp").value = s.whatsapp || "";
  $("addr").value = s.address || "";
  $("cdb").value = s.rh_cdb || "";
  $("fbkey").value = s.rh_fbkey || "";
  $("fbemail").value = s.rh_fbemail || "";
  $("fbpass").value = s.rh_fbpass || "";

  var opts = "";
  CATS.forEach(function (c) { opts += '<option value="' + esc(c) + '">' + catIcon(c) + " " + esc(c) + "</option>"; });
  $("pcat").innerHTML = opts;

  $("pcat").addEventListener("change", syncSub);
  syncSub();

  $("saveSett").addEventListener("click", saveSettings);
  $("pubCloud").addEventListener("click", publishCloud);
  $("addProd").addEventListener("click", addProduct);
  $("genLink").addEventListener("click", genLink);
  $("logout").addEventListener("click", function () { authClear(); location.href = "login.html"; });
  $("pfile").addEventListener("change", onPickPhoto);
  $("imgPrevs").addEventListener("click", function (ev) {
    var b = ev.target;
    if (b && b.dataset && b.dataset.rmprev !== undefined) rmPrevAt(+b.dataset.rmprev);
    ev.stopPropagation();
  });

  renderList();
  showStorage();
}

var curImgs = [];
var busy = false;

function onPickPhoto() {
  var files = Array.prototype.slice.call($("pfile").files);
  var room = 5 - curImgs.length;
  if (files.length > room) { toast("Zyada se zyada 5 photos choose kar sakte ho.", "bad"); }
  files = files.slice(0, room);
  busy = true;
  $("addProd").disabled = true;
  $("addProd").textContent = "Photos load ho rahi hain…";
  $("imgCount").textContent = "⌛ photos load ho rahi hain…";
  $("imgCount").className = "hint warn";
  readNext(files, 0);
}

function readNext(files, i) {
  if (i >= files.length) { finishPick(); return; }
  var f = files[i];
  if (f.size > 8 * 1024 * 1024) { toast("Har photo 8 MB se chhota chahiye.", "bad"); readNext(files, i + 1); return; }
  var rd = new FileReader();
  rd.onload = function () {
    resizeImage(rd.result, 640, function (small) {
      curImgs.push(small || rd.result);
      renderPrev();
      readNext(files, i + 1);
    });
  };
  rd.onerror = function () { toast("Photo " + (f.name || "") + " padhni nahi aayi.", "bad"); readNext(files, i + 1); };
  rd.readAsDataURL(f);
}

function finishPick() {
  busy = false;
  $("addProd").disabled = false;
  $("addProd").textContent = "＋ Add Product";
  renderPrev();
  if (curImgs.length < 3) toast("Kam se kam 3 photos chunni hain.", "bad");
  else toast(curImgs.length + " photos ready ✔", "ok");
}

function renderPrev() {
  var box = $("imgPrevs");
  if (!curImgs.length) { box.classList.add("hidden"); box.innerHTML = ""; }
  else {
    box.classList.remove("hidden");
    box.innerHTML = curImgs.map(function (d, ix) {
      return '<div class="pv"><img src="' + d + '" alt="p' + ix + '"><button type="button" class="pvx" data-rmprev="' + ix + '" title="Remove">×</button></div>';
    }).join("");
  }
  $("imgCount").textContent = curImgs.length + " / 5 photos";
  if (curImgs.length < 3) { $("imgCount").className = "hint warn"; $("imgCount").textContent += " — kam se kam 3 chahiye"; }
  else { $("imgCount").className = "hint ok"; }
}

function rmPrevAt(ix) {
  curImgs.splice(ix, 1);
  $("pfile").value = "";
  renderPrev();
}

function resizeImage(dataUrl, maxW, cb, qual) {
  var img = new Image();
  img.onload = function () {
    try {
      var scale = Math.min(1, maxW / img.width);
      var cw = Math.round(img.width * scale);
      var ch = Math.round(img.height * scale);
      var cv = document.createElement("canvas");
      cv.width = cw;
      cv.height = ch;
      var ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, cw, ch);
      cb(cv.toDataURL("image/jpeg", qual || 0.72));
    } catch (e) { cb(dataUrl); }
  };
  img.onerror = function () { cb(dataUrl); };
  img.src = dataUrl;
}

function cloudSlim(p, cb) {
  if (!p.images || !p.images.length) { cb(p); return; }
  var slim = JSON.parse(JSON.stringify(p));
  var src = p.images.slice();
  slim.images = [];
  var total = src.length;
  var done = 0;
  src.forEach(function (srcImg) {
    resizeImage(srcImg, 380, function (small) {
      if (small && small.length > 180000) {
        resizeImage(srcImg, 240, function (tiny) {
          slim.images.push((tiny && tiny.length < small.length) ? tiny : small);
          done++;
          if (done >= total) { slim.img = slim.images[0]; cb(slim); }
        }, 0.35);
      } else {
        slim.images.push(small || srcImg);
        done++;
        if (done >= total) { slim.img = slim.images[0]; cb(slim); }
      }
    }, 0.5);
  });
}

function storageUsed() {
  try {
    var n = 0;
    ["rh_products", "rh_orders", "rh_settings"].forEach(function (k) {
      var v = localStorage.getItem(k);
      if (v) n += v.length;
    });
    return (n / 1024 / 1024).toFixed(2) + " MB";
  } catch (e) { return "?"; }
}

function showStorage() {
  var el = $("storeMeter");
  if (!el) return;
  var n = 0;
  var v = localStorage.getItem("rh_products");
  if (v) n += v.length;
  var pct = Math.min(100, Math.round((n / (4.5 * 1024 * 1024)) * 100));
  el.innerHTML = "Storage: <b>" + storageUsed() + "</b> / ~5 MB";
  if (pct > 70) el.className = "hint warn";
  else if (pct > 45) el.className = "hint";
  el.title = localStorage.getItem("rh_products") ? "Products data: " + (localStorage.getItem("rh_products").length / 1024).toFixed(0) + " KB" : "Products data: 0 KB";
}

function comboSubs() {
  var out = [];
  ["Men", "Women"].forEach(function (g) {
    ["Top Wear", "Bottom Wear"].forEach(function (w) {
      out.push(g + " " + w);
    });
  });
  return out;
}

function syncSub() {
  var has = !!SUBS[$("pcat").value];
  $("psubWrap").classList.toggle("hidden", !has);
  $("psizesWrap").classList.toggle("hidden", !has);
  if (has) {
    var h = "";
    comboSubs().forEach(function (s2) { h += '<option value="' + esc(s2) + '">' + esc(s2) + "</option>"; });
    $("psub").innerHTML = h;
  }
}

function saveSettings() {
  s.shopName = $("shopName").value.trim() || "Ridhyansh";
  s.rh_user = $("user").value.trim() || "admin";
  s.upiId = $("upiId").value.trim();
  s.whatsapp = $("whatsapp").value.trim();
  s.address = $("addr").value.trim();
  if ($("pass").value.trim()) {
    if ($("pass").value.trim().length < 4) { toast("Password kam se kam 4 characters ka rakho.", "bad"); return; }
    s.rh_pass = $("pass").value.trim();
  }
  s.rh_cdb = $("cdb").value.trim();
  s.rh_fbkey = $("fbkey").value.trim();
  s.rh_fbemail = $("fbemail").value.trim();
  s.rh_fbpass = $("fbpass").value.trim();
  saveSett(s);
  lsSet("rh_cred_v", 3);
  $("brand").textContent = s.shopName;
  $("pass").value = "";
  toast("Settings save ho gayi ✔");
  setTimeout(function () { $("settMsg").textContent = ""; }, 500);
  if (s.rh_cdb && s.rh_fbemail && s.rh_fbpass) {
    fbBootstrap().then(function (r) {
      if (r.ok) { toast("Firebase auth connected — owner verified ✔", "ok"); s.rh_fbuid = r.au.localId; saveSett(s); }
      else toast("config already set ya owner field check karo.", "bad");
    }).catch(function () {
      toast("Firebase setup me galti — Email/Password check karo.", "bad");
    });
  } else if (s.rh_cdb) {
    toast("Secure publish ke liye Firebase Email + Password bharo.", "bad");
  }
}

function fbErrMsg(e) {
  if (e === "nokey" || e === "nocreds") return "Pehle Firebase Owner Email + Password Settings mein daalo.";
  if (e.message && e.message.indexOf("API key") !== -1) return "Firebase API Key galat hai — field KHAALI chhod do (default set hai), phir Save karo.";
  return "Firebase auth fail — Email/Password check karo.";
}

function publishCloud() {
  if (!dbUrl()) { toast("Pehle Cloud DB URL Settings mein daalo.", "bad"); return; }
  var prods = getProds();
  if (!prods.length) { toast("Pehle products add karo phir publish karo.", "bad"); return; }
  fbLogin().then(function (au) {
    return new Promise(function (resolve) {
      var slimmed = [];
      var left = prods.length;
      prods.forEach(function (p) {
        cloudSlim(p, function (sl) { slimmed.push(sl); if (--left === 0) resolve(slimmed); });
      });
    }).then(function (slimmed) {
      var jobs = slimmed.map(function (p) {
        return cput("products/" + p.id, p, au.idToken).then(function (ok) { return { id: p.id, name: p.name, ok: ok }; });
      });
      return cget("products", au.idToken).then(function (cloud) {
        var localIds = prods.map(function (p) { return String(p.id); });
        if (cloud && typeof cloud === "object") {
          Object.keys(cloud).forEach(function (k) {
            if (localIds.indexOf(k) === -1) jobs.push(cput("products/" + k, null, au.idToken).then(function (ok) { return { id: k, name: "(purana)", ok: ok }; }));
          });
        }
        return Promise.all(jobs);
      });
    });
  }).then(function (oks) {
    var fails = oks.filter(function (x) { return !x.ok; });
    if (!fails.length) { toast("Catalog cloud par publish ho gaya — sabko dikhega ✔", "ok"); return; }
    toast("Publish fail: " + fails.map(function (f) { return f.name; }).join(", ") + " — photos bahut badi hain. Un product ko dubara (kam resolution) photos ke saath add karo.", "bad");
  }).catch(function (e) { toast(fbErrMsg(e), "bad"); });
}

function addProduct() {
  if (busy) { toast("Ruko, photos load ho rahi hain…", "bad"); return; }
  var n = $("pname").value.trim();
  var price = parseInt($("pprice").value, 10);
  if (!n || !price || price < 1) { toast("Naam aur sahi price dono chahiye.", "bad"); return; }
  if (curImgs.length < 3) { toast("Kam se kam 3 photos choose karo.", "bad"); return; }
  if (curImgs.length > 5) { toast("Zyada se zyada 5 photos ho sakti hain.", "bad"); return; }
  var p = getProds();
  var imgs = curImgs.slice();
  var prod = {
    id: Date.now(),
    name: n,
    cat: $("pcat").value,
    price: price,
    images: imgs,
    img: imgs[0],
    desc: $("pdesc").value.trim()
  };
  if (SUBS[prod.cat]) {
    prod.sub = $("psub").value;
    var sz = $("psizes").value.trim();
    if (sz) prod.sizes = sz.split(",").map(function (x) { return x.trim(); }).filter(Boolean);
  }
  p.push(prod);
  if (!saveProds(p)) {
    $("prodMsg").textContent = "Storage bhar gaya hai — purane products delete karo ya photos kam karo (chhoti photos milegi).";
    p.pop();
    return;
  }
  $("prodMsg").textContent = "";
  $("pname").value = ""; $("pprice").value = ""; $("pdesc").value = "";
  $("pfile").value = "";
  curImgs = [];
  renderPrev();
  renderList();
  toast("Product " + imgs.length + " photos ke saath add ho gaya ✔");
  publishCloud();
}

function thumb(p) {
  return p && p.img
    ? '<div class="th" style="background-image:url(' + esc(p.img) + ')"></div>'
    : '<div class="th em">' + catIcon(p.cat) + "</div>";
}

function renderList() {
  var p = getProds();
  $("pc").textContent = p.length;
  var h = "";
  p.forEach(function (pr) {
    h += '<div class="plist-row">' + thumb(pr) +
      '<div class="plist-info"><b>' + esc(pr.name) + "</b>" +
      '<span>' + catIcon(pr.cat) + " " + esc(pr.cat) + (pr.sub ? " · " + esc(pr.sub) : "") + " · " + inr(pr.price) + (pr.sizes && pr.sizes.length ? " · Sizes: " + esc(pr.sizes.join(", ")) : "") + "</span></div>" +
      '<div class="plist-actions">' +
      '<button class="btn sm link2" data-link="' + pr.id + '" title="Product URL copy karo (ad mein dalna)">🔗 Link</button>' +
      '<button class="btn danger sm" data-del="' + pr.id + '">Delete</button>' +
      "</div></div>";
  });
  $("plist").innerHTML = h || '<div class="plist-empty">📮 Abhi koi product nahi — upar "Add Product" se daalo.</div>';
}

document.addEventListener("click", function (e) {
  var link = e.target.closest("[data-link]");
  if (link) {
    var base = location.href.split("admin.html")[0] || location.href;
    copyText(base + "order.html?p=" + link.getAttribute("data-link"), link);
    toast("Product URL copy ho gaya — ad mein paste karo ✔", "ok");
    return;
  }
  var d = e.target.closest("[data-del]");
  if (!d) return;
  if (!confirm("Yeh product delete karna hai?")) return;
  var p = getProds().filter(function (pr) { return String(pr.id) !== d.getAttribute("data-del"); });
  saveProds(p);
  renderList();
  toast("Product delete ho gaya.");
  publishCloud();
});

function genLink() {
  var amount = Math.round(parseFloat($("gamt").value || "0"));
  if (!amount || amount < 1) { toast("Pehle amount likhiye.", "bad"); return; }
  var note = $("gnote").value.trim() || ("Order " + refCode());
  var link = upiLink(s, amount, note);
  $("gline").textContent = link;
  $("gline").title = link;
  $("gqr").src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(link);
  $("gcopy").onclick = function () { copyText(link, this); };
  var msg = "*" + s.shopName + "* — Payment due\nAmount: " + inr(amount) + "\nNote: " + note +
    "\nPayment link (UPI, prepaid): " + link;
  $("gsend").href = "https://wa.me/" + waDigits(s.whatsapp) + "?text=" + encodeURIComponent(msg);
  $("genOut").classList.remove("hidden");
  $("genOut").scrollIntoView({ behavior: "smooth", block: "center" });
}