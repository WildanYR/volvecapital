import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { EmailSubjectService } from './email-subject.service';

@Controller('email-subject')
export class EmailSubjectController {
  constructor(private readonly emailSubjectService: EmailSubjectService) {}

  @Get()
  findAll() {
    return this.emailSubjectService.findAll();
  }

  @Post()
  create(@Body() data: { context: string; subject: string; is_public?: boolean }) {
    return this.emailSubjectService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: { context?: string; subject?: string; is_public?: boolean }) {
    return this.emailSubjectService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emailSubjectService.remove(id);
  }
}
