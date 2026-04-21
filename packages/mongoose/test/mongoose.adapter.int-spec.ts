import { MongoDBContainer } from '@testcontainers/mongodb';
import mongoose, { Schema } from 'mongoose';
import { MongooseAuditAdapter } from '../src';

describe('MongooseAuditAdapter', () => {
  it('saves records through a user-defined model', async () => {
    const container = await new MongoDBContainer('mongo:7').start();
    let connection: mongoose.Connection | undefined;

    try {
      connection = await mongoose
        .createConnection(
          `mongodb://127.0.0.1:${container.getMappedPort(27017)}/test?directConnection=true`,
        )
        .asPromise();
      const model = connection.model(
        'AuditLog',
        new Schema(
          { action: String, actorId: String, resourceId: String },
          { collection: 'audit_logs' },
        ),
      );

      const adapter = new MongooseAuditAdapter(model);
      await adapter.save({
        action: 'UPDATE',
        actorId: 'user-1',
        resourceId: '123',
      });

      await expect(model.find().lean()).resolves.toMatchObject([
        { action: 'UPDATE', actorId: 'user-1', resourceId: '123' },
      ]);
    } finally {
      await connection?.close();
      await container.stop();
    }
  }, 120000);
});
