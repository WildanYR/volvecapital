import { Controller, Get, Req, UseGuards, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { AccountingService } from './accounting.service';

// Akan ditambahkan Guards nantinya
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('coa')
  async getCoa(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.getCoaList(tenantId);
  }

  @Post('coa')
  async createCoa(@Req() req: any, @Body() body: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.createCoa(tenantId, body);
  }

  @Post('seed-netflix-coa')
  async seedNetflixCoa(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.seedNetflixCoa(tenantId);
  }

  @Put('coa/:id')
  async updateCoa(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.updateCoa(tenantId, id, body);
  }

  @Delete('coa/:id')
  async deleteCoa(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.deleteCoa(tenantId, id);
  }

  @Get('journal')
  async getJournalEntries(@Req() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.getJournalEntries(tenantId, startDate, endDate);
  }

  @Post('journal')
  async createJournalEntry(@Req() req: any, @Body() body: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.createJournalEntry(tenantId, body);
  }

  @Get('ledger')
  async getLedger(@Req() req: any, @Query('coa_id') coaId: string) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    if (!coaId) {
        return { error: 'coa_id is required' };
    }
    return this.accountingService.getLedger(tenantId, coaId);
  }

  @Get('trial-balance')
  async getTrialBalance(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.getTrialBalance(tenantId);
  }

  @Put('journal/:id/void')
  async voidJournal(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.voidJournal(tenantId, id);
  }

  @Get('income-statement')
  async getIncomeStatement(@Req() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.getIncomeStatement(tenantId, startDate, endDate);
  }

  @Get('balance-sheet')
  async getBalanceSheet(@Req() req: any, @Query('asOfDate') asOfDate?: string) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.getBalanceSheet(tenantId, asOfDate);
  }

  @Get('periods')
  async getPeriods(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.getPeriods(tenantId);
  }

  @Post('periods/close')
  async closePeriod(@Req() req: any, @Body() body: { periodName: string; startDate: string; endDate: string }) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.closePeriod(tenantId, body.periodName, body.startDate, body.endDate);
  }

  // --- Platform Accounting Settings ---

  @Get('platform-settings')
  async getPlatformSettings(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.getPlatformSettings(tenantId);
  }

  @Post('platform-settings')
  async createPlatformSetting(@Req() req: any, @Body() body: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.createPlatformSetting(tenantId, body);
  }

  @Put('platform-settings/:id')
  async updatePlatformSetting(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.updatePlatformSetting(tenantId, id, body);
  }

  @Delete('platform-settings/:id')
  async deletePlatformSetting(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.headers['x-tenant-id'] || 'master';
    return this.accountingService.deletePlatformSetting(tenantId, id);
  }
}
