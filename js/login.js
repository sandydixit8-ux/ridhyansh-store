seedIfEmpty();

if (authOk()) { location.href = "admin.html"; }

var s = sett();
var expUser = "ridhyansh007";
var expPass = "admin@123";
if (Number(lsGet("rh_cred_v", 0)) >= 3) {
  expUser = s.rh_user;
  expPass = s.rh_pass;
}

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var u = document.getElementById("luser").value.trim().toLowerCase();
  var p = document.getElementById("lpass").value.trim();
  if (u === String(expUser).toLowerCase() && p === String(expPass)) {
    authSet();
    location.href = "admin.html";
  } else {
    document.getElementById("lerr").classList.remove("hidden");
  }
});