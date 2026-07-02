import {
  buildServiceModelGalleryUpdate,
  getServiceModelThumbPressedState,
} from "./service-model-gallery.js";

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

function activateServiceModelGalleryPreview(gallery, button) {
  const update = buildServiceModelGalleryUpdate(button.dataset);
  const image = gallery.querySelector("[data-service-model-preview-image]");
  const title = gallery.querySelector("[data-service-model-preview-title]");

  if (!update || !image || !title) {
    return;
  }

  image.src = update.image;
  image.alt = update.alt;
  title.textContent = update.title;

  const buttons = Array.from(
    gallery.querySelectorAll("[data-service-model-thumb]"),
  );
  const activeIndex = buttons.indexOf(button);
  const pressedState = getServiceModelThumbPressedState(
    buttons.length,
    activeIndex,
  );

  buttons.forEach((thumb, index) => {
    thumb.setAttribute("aria-pressed", pressedState[index]);
  });
}

document.querySelectorAll("[data-service-model-gallery]").forEach((gallery) => {
  gallery.querySelectorAll("[data-service-model-thumb]").forEach((button) => {
    button.addEventListener("click", () =>
      activateServiceModelGalleryPreview(gallery, button),
    );
    button.addEventListener("focus", () =>
      activateServiceModelGalleryPreview(gallery, button),
    );
    button.addEventListener("pointerenter", () =>
      activateServiceModelGalleryPreview(gallery, button),
    );
  });
});

if (window.lucide) {
  window.lucide.createIcons({
    attrs: {
      "stroke-width": 1.75,
    },
  });
}
