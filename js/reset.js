document.getElementById("doReset").addEventListener("click", function () {
  if (!confirm("Sach me reset karna hai? Is browser ka saara store data clear ho jayega.")) return;
  ["rh_settings", "rh_cred_v", "rh_products", "rh_seed_v", "rh_orders"].forEach(function (k) {
    localStorage.removeItem(k);
  });
  sessionStorage.clear();
  seedIfEmpty();
  var s = sett();
  document.getElementById("rstMsg").textContent = s.shopName + " reset ho gaya ✔ Login: " + s.rh_user + " / " + s.rh_pass;
  setTimeout(function () { location.href = "login.html"; }, 2000);
});