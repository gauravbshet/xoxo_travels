/* Light fade on every route change. Stays out of the way of in-page motion. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
