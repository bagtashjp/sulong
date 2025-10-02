let isDark = false;
function darkmode() {
    const els = document.documentElement.style;
    if (!isDark) {
         els.setProperty("--color-base-background", "44, 44, 44")
         els.setProperty("--color-base-font", "255, 255, 255")
         els.setProperty("--filter-dark-mode", 1);
         localStorage.setItem("color-scheme", "dark");
         els.setProperty("--scheme-background", 'url("assets/tmp_bg_dark.jpg?v=3")');
         document.querySelector("#darkmodie").src = "assets/lightmode-icon.png?v=5";
         isDark = true;
    } else {
         els.setProperty("--color-base-background", "255, 255, 255")
         els.setProperty("--color-base-font", "0, 0, 0")
         els.setProperty("--filter-dark-mode", 0);
         els.setProperty("--scheme-background", 'url(assets/tmp_bg.jpg)');
         localStorage.setItem("color-scheme", "light");
         document.querySelector("#darkmodie").src = "assets/darkmode-icon.png?v=6";
         isDark = false;
    }
}

export function ignite() {
    if (localStorage.getItem("color-scheme") == "dark") {
        darkmode();
    }
}


window.darkmode = darkmode;