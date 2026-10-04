seedIfEmpty();

if (authOk()) { location.href = "admin.html"; }

var s = sett();
var credV = Number(lsGet("rh_cred_v", 0));
var okUser = s.rh_user || "";
var okPass = s.rh_pass || "";
// Default credential is only accepted until the owner sets a personal
// password from Admin > Settings. After that, only the stored password works.
if (credV < 3 && !(s.rh_user && s.rh_pass)) {
  okUser = "ridhyansh007";
  okPass = "admin@123";
}

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var u = document.getElementById("luser").value.trim();
  var p = document.getElementById("lpass").value.trim();
  var users = (okUser || "x").split("\n");
  var passes = (okPass || "y").split("\n");
  var hit = false;
  for (var i = 0; i < users.length; i++) {
    if (u.toLowerCase() === String(users[i]).toLowerCase() && p === String(passes[i])) { hit = true; break; }
  }
  if (hit) {
    authSet();
    location.href = "admin.html";
  } else {
    document.getElementById("lerr").classList.remove("hidden");
  }
});