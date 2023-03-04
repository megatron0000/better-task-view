export class Lock {
  /**
   * true if and only if a client is holding this lock
   * @private
   */
  held = false; // FIXME: using truly private properties (i.e. #held) slows down performance

  /**
   * - resolver(true) signals to the waiting client that it acquired the lock (wakes the client)
   * - resolver(false) signals to the waiting client that it failed to acquire the lock (wakes the client)
   * - the resolver is `null` if there is no client currently waiting for the lock
   *
   * @private
   * @type {null | ((acquiredTheLock: boolean) => void)}
   */
  resolver = null; // FIXME: using truly private properties (i.e. #resolver) slows down performance

  /**
   * Preemptible.
   * - If no client holds the lock, and client A calls hold(): client A acquires the lock
   * - If client A holds the lock, and client B calls hold(): B sleeps waiting for the lock
   * - If B is waiting and a new client C calls hold(): B resumes (having failed to acquire the lock,
   *   see `resolver(false)`), and C sleeps waiting for the lock
   */
  hold() {
    if (this.held === false) {
      this.held = true;
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      if (this.resolver !== null) {
        const currentResolver = this.resolver;
        this.resolver = resolve;
        currentResolver(false);
        return;
      }

      this.resolver = resolve;
    });
  }

  /**
   * Should only be called by a client A that currently holds the lock. A releases the lock and
   * wakes another client B that is currently waiting for the lock (if there is such a B),
   * and B now holds the lock
   */
  release() {
    this.held = false;
    if (this.resolver !== null) {
      this.held = true;
      const currentResolver = this.resolver;
      this.resolver = null;
      currentResolver(true);
    }
  }

  /**
   * Should only be called by a client A that currently holds the lock.
   * - If there is another client B currently waiting for the lock: A releases the lock, B acquires
   *   the lock and resumes.
   * - If there is not such a B: A does not release the lock
   *
   * @returns true if A released the lock to B. False otherwise
   */
  releaseIfContended() {
    if (this.resolver !== null) {
      this.release();
      return true;
    }

    return false;
  }
}
