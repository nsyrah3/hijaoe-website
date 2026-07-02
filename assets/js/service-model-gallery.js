export function buildServiceModelGalleryUpdate(dataset) {
  const update = {
    image: dataset.serviceModelImage,
    alt: dataset.serviceModelAlt,
    title: dataset.serviceModelTitle,
  };

  if (Object.values(update).some((value) => !value)) {
    return null;
  }

  return update;
}

export function getServiceModelThumbPressedState(totalCount, activeIndex) {
  return Array.from({ length: totalCount }, (_, index) =>
    String(index === activeIndex),
  );
}
