/** The orange pin: one glyph for a city on the Origins globe and for its stop on the road. */
export default function CityPin() {
  return (
    <svg className="city-pin" viewBox="0 0 12 16" width="9" height="12" aria-hidden="true" focusable="false">
      <path
        fill="var(--accent-decor)"
        d="M6 0a6 6 0 0 0-6 6c0 4.2 6 10 6 10s6-5.8 6-10a6 6 0 0 0-6-6Zm0 8.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Z"
      />
    </svg>
  );
}
