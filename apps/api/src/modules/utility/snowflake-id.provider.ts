import { Injectable } from '@nestjs/common';
import { Snowflake } from 'nodejs-snowflake';

@Injectable()
export class SnowflakeIdProvider {
  private snowflake: Snowflake;

  constructor() {
    this.snowflake = new Snowflake({ instance_id: 1 });
  }

  generateId() {
    return this.snowflake.getUniqueID().toString();
  }
}
