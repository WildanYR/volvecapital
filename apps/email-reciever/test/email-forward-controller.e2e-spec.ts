import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import * as process from 'node:process';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { EMAIL_SUBJECT_REPOSITORY } from '../src/constants/database.const';
import { PostgresProvider } from '../src/database/postgres.provider';
import { InvalidDataException } from '../src/exceptions/invalid-data.exception';
import { EmailForwardQueueStore } from '../src/modules/email-forward/email-forward-queue.store';

function createTransaction() {
  return {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };
}

describe('Email forward controller (e2e)', () => {
  let app: INestApplication;

  const mockTransaction = createTransaction();
  const mockPostgresProvider = {
    transaction: jest.fn(async () => mockTransaction),
    setSchema: jest.fn(async () => undefined),
  };
  const mockEmailSubjectRepository = {
    findAll: jest.fn(),
  };
  const mockQueueStore = {
    enqueue: jest.fn(() => 1),
  };

  beforeAll(async () => {
    process.env.PORT = '0';
    process.env.EMAIL_QUEUE_WORKER_ENABLED = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresProvider)
      .useValue(mockPostgresProvider)
      .overrideProvider(EMAIL_SUBJECT_REPOSITORY)
      .useValue(mockEmailSubjectRepository)
      .overrideProvider(EmailForwardQueueStore)
      .useValue(mockQueueStore)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        exceptionFactory: errors => new InvalidDataException(errors),
      }),
    );
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockTransaction.commit.mockClear();
    mockTransaction.rollback.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('queues valid payloads and returns 204', async () => {
    await request(app.getHttpServer())
      .post('/email-forward')
      .send({
        tenant: 'tenant_alpha',
        emails: [
          {
            from: 'test@example.com',
            subject: 'Netflix OTP',
            date: '2026-03-30T00:00:00.000Z',
            text: '123456',
          },
        ],
      })
      .expect(204);

    expect(mockQueueStore.enqueue).toHaveBeenCalledWith({
      tenant: 'tenant_alpha',
      emails: [
        {
          from: 'test@example.com',
          subject: 'Netflix OTP',
          date: new Date('2026-03-30T00:00:00.000Z'),
          text: '123456',
        },
      ],
    });
  });

  it('returns subjects from master schema', async () => {
    mockEmailSubjectRepository.findAll.mockResolvedValue([
      { dataValues: { subject: 'Netflix OTP' } },
      { dataValues: { subject: 'Netflix Reset' } },
    ]);

    await request(app.getHttpServer())
      .get('/email-forward/subject')
      .expect(200)
      .expect({
        subjects: ['Netflix OTP', 'Netflix Reset'],
      });

    expect(mockPostgresProvider.setSchema).toHaveBeenNthCalledWith(1, 'master', mockTransaction);
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('returns API-style validation errors for invalid payloads', async () => {
    await request(app.getHttpServer())
      .post('/email-forward')
      .send({
        tenant: '',
        emails: [
          {
            from: '',
            subject: '',
            date: 'not-a-date',
            text: '',
          },
        ],
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.invalidData).toBe(true);
        expect(body.message).toContain('tenant should not be empty');
      });
  });

  it('does not return 204 when queue insert fails', async () => {
    mockQueueStore.enqueue.mockImplementationOnce(() => {
      throw new Error('queue failed');
    });

    await request(app.getHttpServer())
      .post('/email-forward')
      .send({
        tenant: 'tenant_alpha',
        emails: [
          {
            from: 'test@example.com',
            subject: 'Netflix OTP',
            date: '2026-03-30T00:00:00.000Z',
            text: '123456',
          },
        ],
      })
      .expect(500)
      .expect(({ body }) => {
        expect(body.message).toBe('Internal server error');
      });
  });
});
