export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderServices(items) {
  return items
    .map(
      (service, index) => `
        <article class="service-item">
          <div class="service-item__topline">
            <span class="service-item__number">${String(index + 1).padStart(2, "0")}</span>
            <i data-lucide="${escapeHtml(service.icon)}" aria-hidden="true"></i>
          </div>
          <h3>${escapeHtml(service.title)}</h3>
          <p>${escapeHtml(service.description)}</p>
          <ul>
            ${service.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      `,
    )
    .join("");
}

export function renderProjects(items) {
  return items
    .map(
      (project, index) => `
        <article class="project-item ${index === 0 ? "project-item--wide" : ""}">
          <img
            src="${escapeHtml(project.image)}"
            alt="${escapeHtml(project.alt)}"
            loading="lazy"
            width="960"
            height="640"
          >
          <div class="project-item__shade"></div>
          <div class="project-item__content">
            <p>${escapeHtml(project.category)}</p>
            <h3>${escapeHtml(project.title)}</h3>
          </div>
        </article>
      `,
    )
    .join("");
}

export function renderProjectPreview(items) {
  const activeProject = items[0];

  if (!activeProject) {
    return "";
  }

  return `
    <div class="project-preview" data-project-preview>
      <article class="project-preview__stage">
        <img
          src="${escapeHtml(activeProject.image)}"
          alt="${escapeHtml(activeProject.alt)}"
          width="960"
          height="640"
          loading="lazy"
          data-project-preview-image
        >
        <div class="project-preview__shade"></div>
        <div class="project-preview__content">
          <p data-project-preview-category>${escapeHtml(activeProject.category)}</p>
          <h3 data-project-preview-title>${escapeHtml(activeProject.title)}</h3>
        </div>
      </article>
      <div class="project-preview__thumbs" aria-label="Pilih contoh bidang pekerjaan">
        ${items
          .map(
            (project, index) => `
              <button
                class="project-preview__thumb"
                type="button"
                aria-label="Tampilkan ${escapeHtml(project.title)}"
                aria-pressed="${index === 0 ? "true" : "false"}"
                data-project-thumb
                data-project-title="${escapeHtml(project.title)}"
                data-project-category="${escapeHtml(project.category)}"
                data-project-image="${escapeHtml(project.image)}"
                data-project-alt="${escapeHtml(project.alt)}"
              >
                <img src="${escapeHtml(project.image)}" alt="" width="160" height="107" loading="lazy">
                <span>${escapeHtml(project.category)}</span>
                <strong>${escapeHtml(project.title)}</strong>
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

export function renderProcess(items) {
  return items
    .map(
      (step, index) => `
        <li class="process-item">
          <span class="process-item__number">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>${escapeHtml(step.title)}</h3>
            <p>${escapeHtml(step.description)}</p>
          </div>
        </li>
      `,
    )
    .join("");
}

export function renderServiceAreas(items) {
  return items
    .map(
      (area) => `
        <li>
          <i data-lucide="map-pin" aria-hidden="true"></i>
          <div>
            <strong>${escapeHtml(area.city)}</strong>
            <span>${escapeHtml(area.note)}</span>
          </div>
        </li>
      `,
    )
    .join("");
}
