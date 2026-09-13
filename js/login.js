seedIfEmpty();

if (authOk()) { location.href = "admin.html"; }

var s = sett();

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var u = document.getElementById("luser").value.trim();
  var p = document.getElementById("lpass").value;
  if (u === s.rh_user && p === s.rh_pass) {
    authSet();
    location.href = "admin.html";
  } else {
    document.getElementById("lerr").classList.remove("hidden");
  }
});