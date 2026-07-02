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

document.querySelectorAll("[data-service-model-gallery]").forEach((gallery) => {
  const previewImage = gallery.querySelector("[data-service-model-preview-image]");
  const previewTitle = gallery.querySelector("[data-service-model-preview-title]");
  const thumbs = [...gallery.querySelectorAll("[data-service-model-thumb]")];

  if (!previewImage || !previewTitle || thumbs.length === 0) {
    return;
  }

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const { serviceModelImage, serviceModelAlt, serviceModelTitle } = thumb.dataset;

      if (!serviceModelImage || !serviceModelAlt || !serviceModelTitle) {
        return;
      }

      thumbs.forEach((item) => item.setAttribute("aria-pressed", "false"));
      thumb.setAttribute("aria-pressed", "true");
      previewImage.dataset.switching = "true";
      previewImage.src = serviceModelImage;
      previewImage.alt = serviceModelAlt;
      previewTitle.textContent = serviceModelTitle;

      window.setTimeout(() => {
        delete previewImage.dataset.switching;
      }, 180);
    });
  });
});

if (window.lucide) {
  window.lucide.createIcons({
    attrs: {
      "stroke-width": 1.75,
    },
  });
}
