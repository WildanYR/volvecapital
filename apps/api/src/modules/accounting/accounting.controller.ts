import { Controller, Get, Request, UseGuards, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AmortizationService } from './amortization.service';
import { CreateJournalTemplateDto } from './dto/create-journal-template.dto';
import { UpdateJournalTemplateDto } from './dto/update-journal-template.dto';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppRequest } from 'src/types/app-request.type';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { PublicRoute } from 'src/guards/public-route.decorator';

@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly amortizationService: AmortizationService,
    private readonly postgresProvider: PostgresProvider,
  ) {}

  @PublicRoute()
  @Post('trigger-amortization')
  async triggerAmortization() {
    const result = await this.amortizationService.handleDailyAmortization(true);
    return result || { success: true, message: 'Amortization triggered successfully' };
  }

  @Get('coa')
  @RequirePermissions('accounting.view')
  async getCoa(@Request() request: AppRequest) {
    return this.accountingService.getCoaList(request.tenant_id!);
  }

  @Post('coa')
  @RequirePermissions('accounting.edit')
  async createCoa(@Request() request: AppRequest, @Body() body: any) {
    return this.accountingService.createCoa(request.tenant_id!, body);
  }

  @Post('seed-netflix-coa')
  @RequirePermissions('accounting.edit')
  async seedNetflixCoa(@Request() request: AppRequest) {
    return this.accountingService.seedNetflixCoa(request.tenant_id!);
  }

  @Put('coa/:id')
  @RequirePermissions('accounting.edit')
  async updateCoa(@Request() request: AppRequest, @Param('id') id: string, @Body() body: any) {
    return this.accountingService.updateCoa(request.tenant_id!, id, body);
  }

  @Delete('coa/:id')
  @RequirePermissions('accounting.edit')
  async deleteCoa(@Request() request: AppRequest, @Param('id') id: string) {
    return this.accountingService.deleteCoa(request.tenant_id!, id);
  }

  @Get('journal')
  @RequirePermissions('accounting.view')
  async getJournalEntries(@Request() request: AppRequest, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.accountingService.getJournalEntries(request.tenant_id!, startDate, endDate);
  }

  @Post('journal')
  @RequirePermissions('accounting.edit')
  async createJournalEntry(@Request() request: AppRequest, @Body() body: any) {
    return this.accountingService.createJournalEntry(request.tenant_id!, body);
  }

  @Get('ledger')
  @RequirePermissions('accounting.view')
  async getLedger(@Request() request: AppRequest, @Query('coa_id') coaId: string) {
    if (!coaId) {
        return { error: 'coa_id is required' };
    }
    return this.accountingService.getLedger(request.tenant_id!, coaId);
  }

  @Get('trial-balance')
  @RequirePermissions('accounting.view')
  async getTrialBalance(@Request() request: AppRequest) {
    return this.accountingService.getTrialBalance(request.tenant_id!);
  }

  @Put('journal/:id/void')
  @RequirePermissions('accounting.edit')
  async voidJournal(@Request() request: AppRequest, @Param('id') id: string) {
    return this.accountingService.voidJournal(request.tenant_id!, id);
  }

  @Get('income-statement')
  @RequirePermissions('accounting.view')
  async getIncomeStatement(@Request() request: AppRequest, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.accountingService.getIncomeStatement(request.tenant_id!, startDate, endDate);
  }

  @Get('balance-sheet')
  @RequirePermissions('accounting.view')
  async getBalanceSheet(@Request() request: AppRequest, @Query('asOfDate') asOfDate?: string) {
    return this.accountingService.getBalanceSheet(request.tenant_id!, asOfDate);
  }

  @Get('cash-flow')
  @RequirePermissions('accounting.view')
  async getCashFlowStatement(@Request() request: AppRequest, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.accountingService.getCashFlowStatement(request.tenant_id!, startDate, endDate);
  }

  @Get('periods')
  @RequirePermissions('accounting.view')
  async getPeriods(@Request() request: AppRequest) {
    return this.accountingService.getPeriods(request.tenant_id!);
  }

  @Post('periods/close')
  @RequirePermissions('accounting.edit')
  async closePeriod(@Request() request: AppRequest, @Body() body: { periodName: string; startDate: string; endDate: string }) {
    return this.accountingService.closePeriod(request.tenant_id!, body.periodName, body.startDate, body.endDate);
  }

  // --- Platform Accounting Settings ---

  @Get('platform-settings')
  @RequirePermissions('accounting.view')
  async getPlatformSettings(@Request() request: AppRequest) {
    return this.accountingService.getPlatformSettings(request.tenant_id!);
  }

  @Post('platform-settings')
  @RequirePermissions('accounting.edit')
  async createPlatformSetting(@Request() request: AppRequest, @Body() body: any) {
    return this.accountingService.createPlatformSetting(request.tenant_id!, body);
  }

  @Put('platform-settings/:id')
  @RequirePermissions('accounting.edit')
  async updatePlatformSetting(@Request() request: AppRequest, @Param('id') id: string, @Body() body: any) {
    return this.accountingService.updatePlatformSetting(request.tenant_id!, id, body);
  }

  @Delete('platform-settings/:id')
  @RequirePermissions('accounting.edit')
  async deletePlatformSetting(@Request() request: AppRequest, @Param('id') id: string) {
    return this.accountingService.deletePlatformSetting(request.tenant_id!, id);
  }

  // --- Journal Templates ---

  @Get('templates')
  @RequirePermissions('accounting.view')
  async getJournalTemplates(@Request() request: AppRequest) {
    return this.accountingService.getJournalTemplates(request.tenant_id!);
  }

  @Post('templates')
  @RequirePermissions('accounting.edit')
  async createJournalTemplate(@Request() request: AppRequest, @Body() body: CreateJournalTemplateDto) {
    return this.accountingService.createJournalTemplate(request.tenant_id!, body);
  }

  @Put('templates/:id')
  @RequirePermissions('accounting.edit')
  async updateJournalTemplate(@Request() request: AppRequest, @Param('id') id: string, @Body() body: UpdateJournalTemplateDto) {
    return this.accountingService.updateJournalTemplate(request.tenant_id!, id, body);
  }

  @Delete('templates/:id')
  @RequirePermissions('accounting.edit')
  async deleteJournalTemplate(@Request() request: AppRequest, @Param('id') id: string) {
    return this.accountingService.deleteJournalTemplate(request.tenant_id!, id);
  }
}
