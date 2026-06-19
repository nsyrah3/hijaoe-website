import {
  business,
  processSteps,
  projects,
  serviceAreas,
  services,
  buildWhatsAppUrl,
} from "./site-data.js";
import {
  renderProcess,
  renderProjects,
  renderServiceAreas,
  renderServices,
} from "./render.js";

const consultationMessage =
  "Halo HIJAOE, saya ingin konsultasi mengenai pekerjaan konstruksi atau pesanan custom.";
const whatsappUrl = buildWhatsAppUrl(consultationMessage);

document.querySelector("#services-grid").innerHTML = renderServices(services);
document.querySelector("#projects-grid").innerHTML = renderProjects(projects);
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
  if (event.key === "Escape") {
    closeMenu();
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
