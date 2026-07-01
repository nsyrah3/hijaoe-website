import {
  business,
  processSteps,
  projects,
  serviceAreas,
  services,
  buildWhatsAppUrl,
} from "./site-data.js?v=20260701-sulsel-area";
import {
  renderProcess,
  renderProjectPreview,
  renderServiceAreas,
  renderServices,
} from "./render.js";
import { shouldRestoreMenuFocusOnKey } from "./catalog.js";
import {
  buildProjectPreviewUpdate,
  getProjectThumbPressedState,
} from "./project-preview.js";

const consultationMessage =
  "Halo HIJAOE, saya ingin konsultasi mengenai pekerjaan konstruksi atau pesanan custom.";
const whatsappUrl = buildWhatsAppUrl(consultationMessage);

document.querySelector("#services-grid").innerHTML = renderServices(services);
document.querySelector("#projects-grid").innerHTML = renderProjectPreview(projects);
document.querySelector("#process-list").innerHTML = renderProcess(processSteps);
document.querySelector("#service-areas").innerHTML =
  renderServiceAreas(serviceAreas);

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = whatsappUrl;
});

document.querySelectorAll("[data-business-name]").forEach((element) => {
  element.textContent = business.name;
});

document.querySelector("[data-phone]").textContent = business.phoneDisplay;
document.querySelector("[data-hours]").textContent = business.hours;
document.querySelector("[data-closed]").textContent = business.closed;
document.querySelector("[data-city]").textContent = business.city;
document.querySelector("[data-area-title]").textContent =
  business.serviceAreaTitle;
document.querySelector("[data-service-area]").textContent = business.serviceArea;
document.querySelector("[data-map]").href = business.mapUrl;
document.querySelector("[data-year]").textContent = new Date().getFullYear();

const menuButton = document.querySelector("#menu-button");
const primaryNavigation = document.querySelector("#primary-navigation");
const projectPreview = document.querySelector("[data-project-preview]");

function activateProjectPreview(button) {
  if (!projectPreview || !button) {
    return;
  }

  const update = buildProjectPreviewUpdate(button.dataset);
  const image = projectPreview.querySelector("[data-project-preview-image]");
  const category = projectPreview.querySelector("[data-project-preview-category]");
  const title = projectPreview.querySelector("[data-project-preview-title]");

  if (!update || !image || !category || !title) {
    return;
  }

  image.src = update.image;
  image.alt = update.alt;
  category.textContent = update.category;
  title.textContent = update.title;

  const buttons = Array.from(projectPreview.querySelectorAll("[data-project-thumb]"));
  const activeIndex = buttons.indexOf(button);
  const pressedState = getProjectThumbPressedState(buttons.length, activeIndex);

  buttons.forEach((thumb, index) => {
    thumb.setAttribute("aria-pressed", pressedState[index]);
  });
}

if (projectPreview) {
  const hoverPreview = window.matchMedia("(hover: hover)").matches;

  projectPreview.querySelectorAll("[data-project-thumb]").forEach((button) => {
    button.addEventListener("click", () => activateProjectPreview(button));
    button.addEventListener("focus", () => activateProjectPreview(button));

    if (hoverPreview) {
      button.addEventListener("pointerenter", () => activateProjectPreview(button));
    }
  });
}

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  primaryNavigation.dataset.open = "false";
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  primaryNavigation.dataset.open = String(!isOpen);
});

primaryNavigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  const shouldRestoreMenuFocus = shouldRestoreMenuFocusOnKey(
    event.key,
    menuButton.getAttribute("aria-expanded") === "true",
  );

  if (shouldRestoreMenuFocus) {
    closeMenu();
    menuButton.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 860) {
    closeMenu();
  }
});

if (window.lucide) {
  window.lucide.createIcons({
    attrs: {
      "stroke-width": 1.75,
    },
  });
}
