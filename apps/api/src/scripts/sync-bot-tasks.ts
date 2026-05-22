import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AccountService } from '../modules/account/account.service';
import { PostgresProvider } from '../database/postgres.provider';
import { ACCOUNT_REPOSITORY } from '../constants/database.const';
import { Email } from '../database/models/email.model';
import { ProductVariant } from '../database/models/product-variant.model';
import { Product } from '../database/models/product.model';
import { Op } from 'sequelize';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const accountService = app.get(AccountService);
  const postgresProvider = app.get(PostgresProvider);
  const accountRepository = app.get(ACCOUNT_REPOSITORY);
  
  const tenantId = 'paytronik';
  const transaction = await postgresProvider.transaction();
  
  try {
    await postgresProvider.setSchema(tenantId, transaction);
    
    const accounts = await accountRepository.findAll({
      where: { 
        status: { [Op.notIn]: ['disable', 'banned', 'freeze'] } // only process active/ready ones
      },
      include: [
        { model: Email, as: 'email' },
        {
          model: ProductVariant,
          as: 'product_variant',
          include: [{ model: Product, as: 'product' }],
        },
      ],
      transaction
    });
    
    // Commit the outer transaction immediately so we release the connection!
    await transaction.commit();
    
    console.log(`Ditemukan ${accounts.length} akun yang perlu disinkronkan. Menyinkronkan jadwal bot...`);

    for (const account of accounts) {
      await accountService.registerAutomaticTasks(tenantId, account);
    }

    console.log(`Selesai! Jadwal Redis dan Task Queue untuk ${accounts.length} akun berhasil di-update dengan aman.`);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Gagal menyinkronkan:', error);
  } finally {
    await app.close();
  }
}
bootstrap();
