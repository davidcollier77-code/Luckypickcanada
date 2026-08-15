/** Visual-only styles used by the existing community map; map data and interactions stay in app/. */
export const DEFAULT_MAP_THEME = Object.freeze({
  pageStyle: Object.freeze({
    minHeight: '100vh',
    padding: '1rem 1.5rem 4rem',
    color: '#fff9e7',
    fontFamily: 'var(--lpc-body)',
    background: 'radial-gradient(circle at 50% -8%, rgba(245, 194, 66, 0.2), transparent 28%), radial-gradient(circle at 8% 32%, rgba(13, 111, 87, 0.34), transparent 34%), radial-gradient(circle at 96% 60%, rgba(25, 92, 139, 0.22), transparent 33%), linear-gradient(150deg, #06110f 0%, #08231d 47%, #071b2e 100%)',
    overflowX: 'hidden',
    position: 'relative',
  }),
  cardStyle: Object.freeze({
    borderRadius: 26,
    border: '1px solid rgba(255, 231, 155, 0.24)',
    background: 'linear-gradient(145deg, rgba(5, 25, 22, 0.92), rgba(10, 47, 38, 0.8))',
    boxShadow: '0 24px 70px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(18px) saturate(130%)',
  }),
});
