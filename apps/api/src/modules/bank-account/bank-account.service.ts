import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PostgresProvider } from 'src/database/postgres.provider';
import { SnowflakeIdProvider } from '../utility/snowflake-id.provider';
import { MailService } from '../utility/mail.service';
import { TenantBankAccount } from 'src/database/models/tenant-bank-account.model';
import { TenantOwner } from 'src/database/models/tenant-owner.model';
import { TENANT_BANK_ACCOUNT_REPOSITORY, TENANT_OWNER_REPOSITORY } from 'src/constants/database.const';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class BankAccountService {
  private readonly logger = new Logger(BankAccountService.name);

  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly snowflakeIdProvider: SnowflakeIdProvider,
    private readonly mailService: MailService,
    @Inject(TENANT_BANK_ACCOUNT_REPOSITORY)
    private readonly bankAccountRepository: typeof TenantBankAccount,
    @Inject(TENANT_OWNER_REPOSITORY)
    private readonly tenantOwnerRepository: typeof TenantOwner,
  ) {}

  async getAllVerified(tenantId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const accounts = await this.bankAccountRepository.findAll({
        where: { is_verified: true },
        order: [['created_at', 'DESC']],
        transaction: tx,
      });
      await tx.commit();
      return accounts;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async initiateAdd(tenantId: string, dto: CreateBankAccountDto) {
    const tx = await this.postgresProvider.transaction();
    let emailOwner = '';
    try {
      // Get owner email from master schema
      await this.postgresProvider.setSchema('master', tx);
      const owner = await this.tenantOwnerRepository.findOne({
        where: { tenant_id: tenantId },
        transaction: tx,
      });
      
      if (!owner || !owner.email) {
        throw new BadRequestException('Owner email not found for this tenant');
      }
      emailOwner = owner.email;

      // Switch to tenant schema to save bank account
      await this.postgresProvider.setSchema(tenantId, tx);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 10); // 10 minutes expiry

      const id = this.snowflakeIdProvider.generateId();
      
      const newAccount = await this.bankAccountRepository.create({
        id,
        bank_name: dto.bank_name,
        account_number: dto.account_number,
        account_holder: dto.account_holder,
        is_verified: false,
        otp_code: otp,
        otp_expires: expires,
      }, { transaction: tx });

      await tx.commit();

      // Send OTP via email asynchronously
      this.mailService.sendMail({
        to: emailOwner,
        subject: 'OTP Verifikasi Rekening Bank - Digital Premium',
        html: `<p>Halo,</p><p>Anda sedang menambahkan rekening <b>${dto.bank_name} - ${dto.account_number}</b>.</p><p>Kode OTP Anda adalah: <b style="font-size:24px;">${otp}</b></p><p>Kode ini akan kadaluarsa dalam 10 menit.</p><p>Abaikan email ini jika Anda tidak melakukan request tersebut.</p>`,
      });

      return {
        id: newAccount.id,
        message: 'OTP sent to owner email',
        expires_at: expires
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async verifyOtp(tenantId: string, bankAccountId: string, dto: VerifyOtpDto) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      
      const account = await this.bankAccountRepository.findOne({
        where: { id: bankAccountId },
        transaction: tx,
      });

      if (!account) {
        throw new NotFoundException('Rekening tidak ditemukan');
      }

      if (account.is_verified) {
        throw new BadRequestException('Rekening sudah diverifikasi');
      }

      if (!account.otp_expires || new Date() > new Date(account.otp_expires)) {
        throw new BadRequestException('Kode OTP sudah kadaluarsa');
      }

      if (account.otp_code !== dto.otp_code) {
        throw new BadRequestException('Kode OTP salah');
      }

      await account.update({
        is_verified: true,
        otp_code: null,
        otp_expires: null,
      }, { transaction: tx });

      await tx.commit();
      return { message: 'Rekening berhasil diverifikasi' };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async delete(tenantId: string, bankAccountId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      
      const account = await this.bankAccountRepository.findOne({
        where: { id: bankAccountId },
        transaction: tx,
      });

      if (!account) {
        throw new NotFoundException('Rekening tidak ditemukan');
      }

      await account.destroy({ transaction: tx });
      
      await tx.commit();
      return { message: 'Rekening berhasil dihapus' };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
}
