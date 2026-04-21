import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Column, DataSource, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TypeOrmAuditAdapter } from '../src';

@Entity('audit_logs')
class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  action!: string;

  @Column()
  actorId!: string;

  @Column({ nullable: true })
  resourceId!: string;
}

describe('TypeOrmAuditAdapter', () => {
  it('saves records through a user-defined entity', async () => {
    const container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const dataSource = new DataSource({
      type: 'postgres',
      url: container.getConnectionUri(),
      entities: [AuditLogEntity],
      synchronize: true,
    });
    await dataSource.initialize();

    const adapter = new TypeOrmAuditAdapter(dataSource, AuditLogEntity);
    await adapter.save({
      action: 'UPDATE',
      actorId: 'user-1',
      resourceId: '123',
    });

    await expect(dataSource.getRepository(AuditLogEntity).find()).resolves.toMatchObject([
      { action: 'UPDATE', actorId: 'user-1', resourceId: '123' },
    ]);

    await dataSource.destroy();
    await container.stop();
  }, 120000);
});
