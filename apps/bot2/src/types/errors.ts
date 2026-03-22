/**
 * Shared Error Classes
 */

export class ElementNotFoundError extends Error {
  name = 'ElementNotFoundError';
  constructor(message: string) {
    super(message);
  }
}
