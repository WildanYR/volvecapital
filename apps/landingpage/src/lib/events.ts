export const REOPEN_CHECKOUT_EVENT = 'reopen-checkout';

// Singleton for handling modal trigger
export const modalTrigger = {
  cb: null as ((data: any) => void) | null,
  subscribe(fn: (data: any) => void) {
    this.cb = fn;
    return () => { this.cb = null; };
  },
  open(data: any) {
    if (this.cb) {
      this.cb(data);
    } else {
      // Fallback to window event if subscription is not active
      const event = new CustomEvent(REOPEN_CHECKOUT_EVENT, { detail: data });
      window.dispatchEvent(event);
    }
  }
};
