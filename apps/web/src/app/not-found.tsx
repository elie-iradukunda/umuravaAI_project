import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel p-8">
      <p className="kicker">Page Not Found</p>
      <h2 className="section-title mt-3">
        The page you requested does not exist.
      </h2>
      <p className="section-copy">
        Return to the public home page, then sign in again if you want to open
        the workspace.
      </p>
      <Link href="/" className="button-primary mt-6">
        Back Home
      </Link>
    </section>
  );
}
