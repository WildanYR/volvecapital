/**
 * Custom Error Classes for ShopeeOrderModule
 */

export class AlreadyProcessedError extends Error {
  name = 'AlreadyProcessedError';
  constructor(message: string) {
    super(message);
  }
}

export class NoProductBindError extends Error {
  name = 'NoProductBindError';
  constructor(message: string) {
    super(message);
  }
}

export class NoAccountError extends Error {
  name = 'NoAccountError';
  constructor(message: string) {
    super(message);
  }
}

export class TransactionExistNoAccountError extends Error {
  name = 'TransactionExistNoAccountError';
  constructor(message: string) {
    super(message);
  }
}

export class FetchFailedError extends Error {
  name = 'FetchFailedError';
  constructor(message: string) {
    super(message);
  }
}
