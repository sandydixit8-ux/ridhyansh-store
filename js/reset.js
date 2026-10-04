if (!authOk()) { location.href = "login.html"; }

document.getElementById("doReset").addEventListener("click", function () {
  if (!confirm("Reset local store data? Product cache, local orders and catalog version will be cleared. Shop settings are kept.")) return;
  ["rh_products", "rh_seed_v", "rh_orders"].forEach(function (k) {
    localStorage.removeItem(k);
  });
  seedIfEmpty();
  document.getElementById("rstMsg").textContent = "Local store data was reset. Redirecting to login...";
  setTimeout(function () { location.href = "login.html"; }, 2000);
});