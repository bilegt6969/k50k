export const heroQuery = `*[_type == "hero"][0] {
  slides[] {
    backgroundImage
  },
  carouselSettings {
    autoplay,
    autoplaySpeed,
    showNavigation,
    showPagination,
    transition
  }
}`;

export const getAllProductCollectionsQuery = `*[_type == "collection"] {
  _id,
  title,
  slug
}`;
