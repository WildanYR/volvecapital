import type { Roles } from 'src/types/roles.type';
export declare const ROLES_KEY = "ROLES_KEY";
export declare function RolesCheck(...roles: Array<Roles>): import("@nestjs/common").CustomDecorator<string>;
