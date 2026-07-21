const token = localStorage.getItem("token");

if (!token) {
    window.location = "login.html";
}

function logout() {

    localStorage.clear();

    window.location = "login.html";

}