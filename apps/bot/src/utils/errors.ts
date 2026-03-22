export class ElementNotFoundError extends Error {
  name = 'ElementNotFoundError';
}
export class NoProductBindError extends Error {
  name = 'NoProductBindError';
}
export class NoAccountError extends Error {
  name = 'NoAccountError';
}
export class TransactionExistNoAccountError extends Error {
  name = 'TransactionExistNoAccountError';
}
export class AccountCooldownError extends Error {
  name = 'AccountCooldownError';
}
export class AlreadyProcessedError extends Error {
  name = 'AlreadyProcessedError';
}
export class FetchFailedError extends Error {
  name = 'FetchFailedError';
}
export class AuthRequiredError extends Error {
  name = 'AuthRequiredError';
}
export class LoginFailedError extends Error {
  name = 'LoginFailedError';
}
