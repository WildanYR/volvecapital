import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { EmailSubjectService } from './email-subject.service';

@Controller('email-subject')
export class EmailSubjectController {
  constructor(private readonly emailSubjectService: EmailSubjectService) {}

  @Get()
  findAll() {
    return this.emailSubjectService.findAll();
  }

  @Post()
  create(@Body() data: { context: string; subject: string }) {
    return this.emailSubjectService.create(data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emailSubjectService.remove(id);
  }
}
