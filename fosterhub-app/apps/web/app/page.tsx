import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <span className="badge">FosterHub MVP build</span>
        <h1>Simplifying Foster Care, Empowering Families</h1>
        <p>
          The backend auth foundation is now live in development. The next step is building the
          real portal experience on top of it.
        </p>
        <p>
          <Link href="/login">Go to login</Link>
        </p>
      </section>
    </main>
  );
}
