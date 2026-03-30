import { Test } from '@nestjs/testing';
import { EMAIL_MESSAGE_REPOSITORY, EMAIL_SUBJECT_REPOSITORY } from '../src/constants/database.const';
import { PostgresProvider } from '../src/database/postgres.provider';
import { EmailForwardProcessorService } from '../src/modules/email-forward/email-forward-processor.service';
import { AppLoggerService } from '../src/modules/logger/logger.service';
import { SocketGateway } from '../src/modules/socket/socket.gateway';
import { EmailParser } from '../src/modules/utility/email-parser.provider';

function createTransaction() {
  return {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };
}

describe('Email forward processor', () => {
  const mockTransaction = createTransaction();
  const mockPostgresProvider = {
    transaction: jest.fn(async () => mockTransaction),
    setSchema: jest.fn(async () => undefined),
  };
  const mockEmailSubjectRepository = {
    findAll: jest.fn(),
  };
  const mockEmailMessageRepository = {
    create: jest.fn(async () => undefined),
  };
  const mockSocketGateway = {
    sendEvent: jest.fn(async () => undefined),
  };
  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  let processor: EmailForwardProcessorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTransaction.commit.mockClear();
    mockTransaction.rollback.mockClear();

    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailForwardProcessorService,
        EmailParser,
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: PostgresProvider, useValue: mockPostgresProvider },
        { provide: SocketGateway, useValue: mockSocketGateway },
        { provide: EMAIL_SUBJECT_REPOSITORY, useValue: mockEmailSubjectRepository },
        { provide: EMAIL_MESSAGE_REPOSITORY, useValue: mockEmailMessageRepository },
      ],
    }).compile();

    processor = moduleRef.get(EmailForwardProcessorService);
  });

  it('stores parsed OTP email data without raw email text', async () => {
    mockEmailSubjectRepository.findAll.mockResolvedValue([
      { dataValues: { subject: 'Netflix OTP', context: 'NETFLIX_OTP' } },
    ]);

    await processor.processQueuedPayload({
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

    expect(mockPostgresProvider.setSchema).toHaveBeenNthCalledWith(1, 'master', mockTransaction);
    expect(mockPostgresProvider.setSchema).toHaveBeenNthCalledWith(2, 'tenant_alpha', mockTransaction);
    expect(mockEmailMessageRepository.create).toHaveBeenCalledWith({
      from_email: 'test@example.com',
      subject: 'Netflix OTP',
      email_date: new Date('2026-03-30T00:00:00.000Z'),
      parsed_context: 'NETFLIX_OTP',
      parsed_data: '123456',
    }, { transaction: mockTransaction });
    expect(mockSocketGateway.sendEvent).toHaveBeenCalledWith('test_example_com:NETFLIX_OTP', {
      from: 'test@example.com',
      date: new Date('2026-03-30T00:00:00.000Z'),
      subject: 'Netflix OTP',
      data: '123456',
    });
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('stores parsed reset-link email data without raw email text', async () => {
    mockEmailSubjectRepository.findAll.mockResolvedValue([
      { dataValues: { subject: 'Netflix Reset', context: 'NETFLIX_REQ_RESET_PASSWORD' } },
    ]);

    await processor.processQueuedPayload({
      tenant: 'tenant_alpha',
      emails: [
        {
          from: 'test@example.com',
          subject: 'Netflix Reset',
          date: new Date('2026-03-30T00:00:00.000Z'),
          text: 'Please visit https://www.netflix.com/password?token=abc',
        },
      ],
    });

    expect(mockEmailMessageRepository.create).toHaveBeenCalledWith({
      from_email: 'test@example.com',
      subject: 'Netflix Reset',
      email_date: new Date('2026-03-30T00:00:00.000Z'),
      parsed_context: 'NETFLIX_REQ_RESET_PASSWORD',
      parsed_data: 'https://www.netflix.com/password?token=abc',
    }, { transaction: mockTransaction });
  });

  it('does not insert or emit when subjects do not match', async () => {
    mockEmailSubjectRepository.findAll.mockResolvedValue([]);

    await processor.processQueuedPayload({
      tenant: 'tenant_alpha',
      emails: [
        {
          from: 'test@example.com',
          subject: 'Other Subject',
          date: new Date('2026-03-30T00:00:00.000Z'),
          text: '123456',
        },
      ],
    });

    expect(mockEmailMessageRepository.create).not.toHaveBeenCalled();
    expect(mockSocketGateway.sendEvent).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it('rolls back and rethrows when tenant email storage fails', async () => {
    mockEmailSubjectRepository.findAll.mockResolvedValue([
      { dataValues: { subject: 'Netflix OTP', context: 'NETFLIX_OTP' } },
    ]);
    mockEmailMessageRepository.create.mockRejectedValueOnce(new Error('insert failed'));

    await expect(processor.processQueuedPayload({
      tenant: 'tenant_alpha',
      emails: [
        {
          from: 'test@example.com',
          subject: 'Netflix OTP',
          date: new Date('2026-03-30T00:00:00.000Z'),
          text: '123456',
        },
      ],
    })).rejects.toThrow('insert failed');

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });
});
