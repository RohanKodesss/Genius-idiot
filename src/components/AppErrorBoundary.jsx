import { Component } from 'react';
import { Button } from './ui';

export default class AppErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Application render failed', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ivory px-4 py-10">
        <section className="app-card w-full max-w-lg rounded-2xl p-6 sm:p-8" role="alert">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-bordeaux">Unexpected error</p>
          <h1 className="mt-3 font-display text-2xl text-ink sm:text-3xl">This page stopped working</h1>
          <p className="mt-3 text-sm leading-6 text-slate">
            Your saved data is still in your account. Refresh the page to try again.
          </p>
          <Button className="mt-6 w-full sm:w-auto" onClick={() => window.location.reload()}>
            Refresh page
          </Button>
        </section>
      </main>
    );
  }
}
