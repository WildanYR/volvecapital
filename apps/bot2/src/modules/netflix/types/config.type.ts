import { NewPasswordAlgorithm } from "./password.type.js";

export interface NetflixConfig {
  new_password_algorithm: NewPasswordAlgorithm;
  new_password_length: number;
  password_list?: string[];
}