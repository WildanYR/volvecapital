import { Optional } from "../optional-extend";
import { AccountAttributes } from "./account";

export interface EmailAttributes {
  id: string;
  email: string;
  password?: string;
  accounts?: AccountAttributes[];
  created_at: Date;
  updated_at: Date;
}

export interface EmailCreationAttributes
  extends Optional<
    EmailAttributes,
    'id' | 'accounts' | 'created_at' | 'updated_at'
  > {}