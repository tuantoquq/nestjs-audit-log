import { Injectable } from '@nestjs/common';
import { AuditStorageAdapter } from './storage.adapter';

@Injectable()
export class ConsoleAuditAdapter implements AuditStorageAdapter {
  save(record: Record<string, unknown>): Promise<void> {
    console.log(JSON.stringify(record));
    return Promise.resolve();
  }
}
