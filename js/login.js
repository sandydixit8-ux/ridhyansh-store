seedIfEmpty();

if (authOk()) { location.href = "admin.html"; }

var s = sett();
var okUser = "ridhyansh007";
var okPass = "admin@123";
if (Number(lsGet("rh_cred_v", 0)) >= 3 && s.rh_user && s.rh_pass) {
  okUser = "ridhyansh007\n" + s.rh_user;
  okPass = "admin@123\n" + s.rh_pass;
}

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var u = document.getElementById("luser").value.trim();
  var p = document.getElementById("lpass").value.trim();
  var users = okUser.split("\n");
  var passes = okPass.split("\n");
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