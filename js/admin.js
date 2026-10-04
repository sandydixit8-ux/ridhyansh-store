seedIfEmpty();

var s = sett();

function $(id) { return document.getElementById(id); }

function docClick(e) {
  var link = e.target.closest("[data-link]");
  if (link) {
    var id = link.getAttribute("data-link");
    var base = location.href.split("admin.html")[0] || location.href;
    var u = base + "product.html?p=" + id;
    copyText(u, link);
    toast("Product page URL copied — — paste it in the ad. ✔", "ok");
    return;
  }
  var reel = e.target.closest("[data-reel]");
  if (reel) {
    var id2 = reel.getAttribute("data-reel");
    var base2 = location.href.split("admin.html")[0] || location.href;
    var ru = base2 + "reels/" + id2 + "_reel_1080x1920.mp4";
    copyText(ru, reel);
    toast("Reel URL copied ✔ (the file must be present in the reels folder)", "ok");
    return;
  }
  var feat = e.target.closest("[data-feat]");
  if (feat) {
    var f = getProds();
    var fp = f.filter(function (x) { return String(x.id) === String(feat.getAttribute("data-feat")); })[0];
    if (fp) { fp.featured = !fp.featured; saveProds(f); renderList(); toast(fp.featured ? "⭐ Featured ON" : "⭐ Featured OFF"); publishCloud(); }
    return;
  }
  var trend = e.target.closest("[data-trend]");
  if (trend) {
    var t = getProds();
    var tp = t.filter(function (x) { return String(x.id) === String(trend.getAttribute("data-trend")); })[0];
    if (tp) { tp.trending = !tp.trending; saveProds(t); renderList(); toast(tp.trending ? "🔥 Trending ON" : "🔥 Trending OFF"); publishCloud(); }
    return;
  }
  var ed = e.target.closest("[data-edit]");
  if (ed) { startEdit(ed.getAttribute("data-edit")); return; }
  var ce = e.target.closest("[data-cedit]");
  if (ce) { cancelEdit(); return; }
  var d = e.target.closest("[data-del]");
  if (d) {
    if (!confirm("Delete this product?")) return;
    var p = getProds().filter(function (pr) { return String(pr.id) !== d.getAttribute("data-del"); });
    saveProds(p);
    renderList();
    toast("Product deleted.");
    publishCloud();
    return;
  }
  var inc = e.target.closest("[data-inc]");
  var dec = e.target.closest("[data-dec]");
  if (inc || dec) {
    var id = (inc || dec).getAttribute("data-inc") || (inc || dec).getAttribute("data-dec");
    var ps = getProds();
    var pr = ps.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!pr) { toast("Product not found.", "bad"); return; }
    pr.stock = Math.max(0, getStockOf(pr) + (inc ? 1 : -1));
    saveProds(ps);
    renderList();
    toast((inc ? "+1" : "−1") + " stock → " + pr.stock);
    publishCloud();
    return;
  }
}
document.addEventListener("click", docClick);

if (!authOk()) {
  location.href = "login.html";
} else {
  try { init(); } catch (err) { console.error("init error", err); }
}

function init() {
  document.title = s.shopName + " — Admin";
  $("brand").textContent = s.shopName;
  $("verBadge").textContent = "ver7";

  $("shopName").value = s.shopName || "";
  $("user").value = s.rh_user || "";
  $("upiId").value = s.upiId || "";
  $("whatsapp").value = s.whatsapp || "";
  $("addr").value = s.address || "";
  $("shipFee").value = s.shipFee != null ? s.shipFee : "";
  $("freeShipAbove").value = s.freeShipAbove != null ? s.freeShipAbove : "";
  $("cdb").value = s.rh_cdb || "";
  $("fbkey").value = s.rh_fbkey || "";
  $("fbemail").value = s.rh_fbemail || "";
  $("fbpass").value = "";
  $("ga").value = s.ga || "";

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
  loadProds().then(function (list) {
    if (list && list.length) {
      renderList();
      showStorage();
      toast("Cloud products synced — " + list.length + " products loaded.", "ok");
    }
  });
}

var curImgs = [];
var busy = false;
var editId = null;

function onPickPhoto() {
  var files = Array.prototype.slice.call($("pfile").files);
  var room = 5 - curImgs.length;
  if (files.length > room) { toast("You can choose up to 5 photos.", "bad"); }
  files = files.slice(0, room);
  busy = true;
  $("addProd").disabled = true;
  $("addProd").textContent = "Photos loading…";
  $("imgCount").textContent = "⌛ photos loading…";
  $("imgCount").className = "hint warn";
  readNext(files, 0);
}

function readNext(files, i) {
  if (i >= files.length) { finishPick(); return; }
  var f = files[i];
  if (f.size > 8 * 1024 * 1024) { toast("Each photo must be under 8 MB.", "bad"); readNext(files, i + 1); return; }
  var rd = new FileReader();
  rd.onload = function () {
    resizeImage(rd.result, 640, function (small) {
      curImgs.push(small || rd.result);
      renderPrev();
      readNext(files, i + 1);
    });
  };
  rd.onerror = function () { toast("Photo " + (f.name || "") + " could not be read.", "bad"); readNext(files, i + 1); };
  rd.readAsDataURL(f);
}

function finishPick() {
  busy = false;
  $("addProd").disabled = false;
  $("addProd").textContent = "＋ Add Product";
  renderPrev();
  if (curImgs.length < 3) toast("Please choose at least 3 photos.", "bad");
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
  if (curImgs.length < 3) { $("imgCount").className = "hint warn"; $("imgCount").textContent += " — — at least 3 required"; }
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
  s.shopName = $("shopName").value.trim() || "Ridhyansh Store";
  s.rh_user = $("user").value.trim() || "admin";
  s.upiId = $("upiId").value.trim();
  s.whatsapp = $("whatsapp").value.trim();
  s.address = $("addr").value.trim();
  s.shipFee = $("shipFee").value.trim() || "0";
  s.freeShipAbove = $("freeShipAbove").value.trim() || "0";
  if ($("pass").value.trim()) {
    if ($("pass").value.trim().length < 4) { toast("Please keep the password at least 4 characters long.", "bad"); return; }
    s.rh_pass = $("pass").value.trim();
  }
  s.rh_cdb = $("cdb").value.trim();
  s.rh_fbkey = $("fbkey").value.trim();
  s.rh_fbemail = $("fbemail").value.trim();
  if ($("fbpass").value.trim()) s.rh_fbpass = $("fbpass").value.trim();
  s.ga = $("ga").value.trim();
  saveSett(s);
  lsSet("rh_cred_v", 3);
  $("brand").textContent = s.shopName;
  $("pass").value = "";
  toast("Settings saved ✔");
  setTimeout(function () { $("settMsg").textContent = ""; }, 500);
  if (s.rh_cdb && s.rh_fbemail && s.rh_fbpass) {
    fbBootstrap().then(function (r) {
      if (r.ok) { toast("Firebase auth connected — owner verified ✔", "ok"); s.rh_fbuid = r.au.localId; saveSett(s); }
      else toast("config is already set, or check the owner field.", "bad");
    }).catch(function () {
      toast("Firebase setup error — check the Email/Password.", "bad");
    });
  } else if (s.rh_cdb) {
    toast("Enter Firebase Email + Password in Settings to publish securely.", "bad");
  }
}

function fbErrMsg(e) {
  if (e === "nokey" || e === "nocreds") return "First enter the Firebase Owner Email + Password in Settings.";
  if (e.message && e.message.indexOf("API key") !== -1) return "Invalid Firebase API Key — — leave the field EMPTY (the default is set), then Save.";
  return "Firebase auth failed — check the Email/Password.";
}

function publishCloud() {
  if (!dbUrl()) { toast("First enter the Cloud DB URL in Settings.", "bad"); return; }
  var prods = getProds();
  if (!prods.length) { toast("First add products, then publish.", "bad"); return; }
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
    if (!fails.length) { toast("Catalog published to the cloud — now visible to everyone ✔", "ok"); return; }
    toast("Publish failed: " + fails.map(function (f) { return f.name; }).join(", ") + " — The photos are too large. Re-add those products with smaller-resolution photos.", "bad");
  }).catch(function (e) { toast(fbErrMsg(e), "bad"); });
}

function addProduct() {
  if (busy) { toast("Ruko, photos loading…", "bad"); return; }
  var n = $("pname").value.trim();
  var price = parseInt($("pprice").value, 10);
  var mrp = parseInt($("pmrp").value, 10) || 0;
  if (!n || !price || price < 1) { toast("Both a product name and a valid price are required.", "bad"); return; }
  if (mrp && mrp <= price) { toast("MRP must be greater than the selling price.", "bad"); return; }
  if (curImgs.length < 3 && !editId) { toast("Please choose at least 3 photos.", "bad"); return; }
  if (curImgs.length > 5) { toast("A maximum of 5 photos is allowed.", "bad"); return; }
  var p = getProds();
  var imgs = curImgs.slice();
  var stock = parseInt($("pstock").value, 10);
  if (isNaN(stock) || stock < 0) stock = 20;
  var prod = {
    id: Date.now(),
    name: n,
    cat: $("pcat").value,
    price: price,
    mrp: mrp || 0,
    stock: stock,
    images: imgs,
    img: imgs[0],
    desc: $("pdesc").value.trim(),
    sku: $("psku").value.trim() || "",
    colors: splitList($("pcolors").value),
    material: $("pmaterial").value.trim() || "",
    fit: $("pfit").value.trim() || "",
    video: $("pvideo").value.trim() || "",
    slug: $("pslug").value.trim() || slugify(n),
    seoTitle: $("pseotitle").value.trim() || "",
    seoDesc: $("pseodesc").value.trim() || "",
    features: splitList($("pfeatures").value),
    specText: $("pspecText").value.trim() || "",
    longdesc: $("plongdesc").value.trim() || "",
    featured: $("pFeatured").checked || false,
    trending: $("pTrending").checked || false
  };
  if ($("pSold").checked) prod.stock = 0;
  if (SUBS[prod.cat]) {
    prod.sub = $("psub").value;
    var sz = $("psizes").value.trim();
    if (sz) prod.sizes = sz.split(",").map(function (x) { return x.trim(); }).filter(Boolean);
  }
  if (editId) {
    var ex = p.filter(function (x) { return String(x.id) === String(editId); })[0];
    if (!ex) { toast("Product not found.", "bad"); return; }
    Object.keys(prod).forEach(function (k) { ex[k] = prod[k]; });
    if (imgs.length) { ex.images = imgs; ex.img = imgs[0]; }
    if (!saveProds(p)) { toast("Storage full — — remove some photos.", "bad"); return; }
    editId = null;
    $("phead2").textContent = "Add Product";
    $("addProd").innerHTML = "＋ Add Product";
    toast("Product updated ✔");
  } else {
    p.push(prod);
    if (!saveProds(p)) {
      $("prodMsg").textContent = "Storage is full — — delete old products or use fewer/smaller photos.";
      p.pop();
      return;
    }
    toast("Product " + imgs.length + " photos added ✔");
  }
$("prodMsg").textContent = "";
  $("cancelEdit") && $("cancelEdit").classList.add("hidden");
  $("pname").value = ""; $("pprice").value = ""; $("pmrp").value = ""; $("pdesc").value = "";
  $("psizes").value = ""; $("pstock").value = "";
  $("psku").value = ""; $("pslug").value = ""; $("pseotitle").value = ""; $("pseodesc").value = "";
  $("pcolors").value = ""; $("pmaterial").value = ""; $("pfit").value = ""; $("pvideo").value = "";
  $("pfeatures").value = ""; $("pspecText").value = ""; $("plongdesc").value = "";
  $("pFeatured").checked = false; $("pTrending").checked = false; $("pSold").checked = false;
  curImgs = [];
  renderPrev();
  renderList();
  publishCloud();
}

function splitList(v) {
  return String(v || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
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
    var fl = [];
    if (pr.featured) fl.push('<span class="fl-badge feat">⭐</span>');
    if (pr.trending) fl.push('<span class="fl-badge trend">🔥</span>');
    if (videoFor(pr)) fl.push('<span class="fl-badge">▶</span>');
    h += '<div class="plist-row">' + thumb(pr) +
      '<div class="plist-info"><b>' + esc(pr.name) + '</b>' + fl.join("") +
      '<span>' + catIcon(pr.cat) + " " + esc(pr.cat) + (pr.sub ? " · " + esc(pr.sub) : "") + " · " + mrpHtml(pr) + (pr.sizes && pr.sizes.length ? " · Sizes: " + esc(pr.sizes.join(", ")) : "") + ' · Stock: <b>' + getStockOf(pr) + '</b></span></div>' +
      '<div class="plist-actions">' +
      '<button class="btn sm ghost' + (pr.featured ? " on" : "") + '" data-feat="' + pr.id + '" title="Featured toggle (shown first on home page)">⭐</button>' +
      '<button class="btn sm ghost' + (pr.trending ? " on" : "") + '" data-trend="' + pr.id + '" title="Trending toggle">🔥</button>' +
      '<button class="btn sm ghost" data-inc="' + pr.id + '" title="Stock +1">+</button>' +
      '<button class="btn sm ghost" data-dec="' + pr.id + '" title="Stock −1">−</button>' +
      '<button class="btn sm link2" data-link="' + pr.id + '" title="Copy product page URL">🔗</button>' +
      '<button class="btn sm link2" data-reel="' + pr.id + '" title="Copy reel URL (if present in the reels folder)">🎬</button>' +
      '<button class="btn sm" data-edit="' + pr.id + '" title="Edit">✏️</button>' +
      '<button class="btn danger sm" data-del="' + pr.id + '">Del</button>' +
      "</div></div>";
  });
  $("plist").innerHTML = h || '<div class="plist-empty">📮 No products yet — Add them using "Add Product" above.</div>';
}

function startEdit(id) {
  var p = getProds().filter(function (x) { return String(x.id) === String(id); })[0];
  if (!p) { toast("Product not found.", "bad"); return; }
  editId = id;
  $("pname").value = p.name || "";
  $("pprice").value = p.price || "";
  $("pmrp").value = p.mrp || "";
  $("pstock").value = p.stock != null ? p.stock : "";
  $("pdesc").value = p.desc || "";
  $("psku").value = p.sku || "";
  $("pslug").value = p.slug || "";
  $("pseotitle").value = p.seoTitle || "";
  $("pseodesc").value = p.seoDesc || "";
  $("pcolors").value = (p.colors || []).join(", ");
  $("pmaterial").value = p.material || "";
  $("pfit").value = p.fit || "";
  $("pvideo").value = p.video || "";
  $("pfeatures").value = (p.features || []).join(", ");
  $("pspecText").value = p.specText || "";
  $("plongdesc").value = p.longdesc || "";
  $("pFeatured").checked = !!p.featured;
  $("pTrending").checked = !!p.trending;
  $("pSold").checked = getStockOf(p) === 0;
  $("pcat").value = p.cat || "Clothing";
  syncSub();
  if (p.sub) $("psub").value = p.sub;
  $("psizes").value = (p.sizes || []).join(", ");
  $("phead2").textContent = "✏️ Edit Product — " + (p.name || "");
  $("addProd").innerHTML = "💾 Save Changes";
  $("cancelEdit").classList.remove("hidden");
  $("imgCount").textContent = "Photos will remain unchanged (choose new ones to replace them).";
  toast("✏️ Edit mode ON — save karne ke liye 'Save Changes' dabao");
  $("pname").scrollIntoView({ behavior: "smooth", block: "center" });
}

function cancelEdit() {
  editId = null;
  $("phead2").textContent = "Add Product";
  $("addProd").innerHTML = "＋ Add Product";
  $("cancelEdit").classList.add("hidden");
  $("pFeatured").checked = false;
  $("pTrending").checked = false;
  $("pSold").checked = false;
  toast("Edit cancelled.");
}

$("pname").addEventListener("input", function () {
  if (!editId && !$("pslug").value.trim()) {
    $("pslug").value = slugify($("pname").value);
  }
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