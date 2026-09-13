seedIfEmpty();

if (authOk()) { location.href = "admin.html"; }

var s = sett();

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var u = document.getElementById("luser").value.trim().toLowerCase();
  var p = document.getElementById("lpass").value.trim();
  if (u === String(s.rh_user).toLowerCase() && p === String(s.rh_pass)) {
    authSet();
    location.href = "admin.html";
  } else {
    document.getElementById("lerr").classList.remove("hidden");
  }
});