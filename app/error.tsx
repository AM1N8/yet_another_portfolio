"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="section-space">
      <h1 className="section-title">Unable to load this page</h1>
      <p>Please try again.</p>
      <button type="button" className="text-link" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
