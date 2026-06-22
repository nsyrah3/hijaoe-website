const menuButton = document.querySelector("#menu-button");
const primaryNavigation = document.querySelector("#primary-navigation");

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuButton || !primaryNavigation) {
    return;
  }

  menuButton.setAttribute("aria-expanded", "false");
  primaryNavigation.dataset.open = "false";

  if (restoreFocus) {
    menuButton.focus();
  }
}

if (menuButton && primaryNavigation) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    primaryNavigation.dataset.open = String(!isOpen);
  });

  primaryNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuButton.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu({ restoreFocus: true });
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 860) {
      closeMenu();
    }
  });
}

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

if (window.lucide) {
  window.lucide.createIcons({
    attrs: {
      "stroke-width": 1.75,
    },
  });
}
