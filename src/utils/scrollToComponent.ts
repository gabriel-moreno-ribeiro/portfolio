// In-page navigation. The Home listens for NAVIGATE_EVENT and takes over when
// the target is a section that may not be mounted yet (it mounts everything and
// re-aligns after the smooth scroll); anywhere else the plain scroll runs.
export const NAVIGATE_EVENT = "home:navigate";
export interface NavigateDetail {
  id: string;
  offset: number;
}

export const scrollToComponent = (id: string, offset: number = 100) => {
  const event = new CustomEvent<NavigateDetail>(NAVIGATE_EVENT, { detail: { id, offset }, cancelable: true });
  if (!window.dispatchEvent(event)) return;

  const element = document.getElementById(id);

  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};
