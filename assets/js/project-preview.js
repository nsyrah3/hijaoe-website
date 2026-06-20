export function buildProjectPreviewUpdate(dataset) {
  const update = {
    image: dataset.projectImage,
    alt: dataset.projectAlt,
    category: dataset.projectCategory,
    title: dataset.projectTitle,
  };

  if (Object.values(update).some((value) => !value)) {
    return null;
  }

  return update;
}

export function getProjectThumbPressedState(totalCount, activeIndex) {
  return Array.from({ length: totalCount }, (_, index) =>
    String(index === activeIndex),
  );
}
