import { Body, Controller, Delete, Get, Param, Post, Put, Request } from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { TutorialService } from './tutorial.service';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';

@Controller('tutorial')
export class TutorialController {
  constructor(private readonly tutorialService: TutorialService) {}

  @Get()
  findAll(@Request() request: AppRequest) {
    return this.tutorialService.findAll(request.tenant_id!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() request: AppRequest) {
    return this.tutorialService.findOne(request.tenant_id!, id);
  }

  @Post()
  create(@Body() dto: CreateTutorialDto, @Request() request: AppRequest) {
    return this.tutorialService.create(request.tenant_id!, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTutorialDto,
    @Request() request: AppRequest,
  ) {
    return this.tutorialService.update(request.tenant_id!, id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() request: AppRequest) {
    return this.tutorialService.delete(request.tenant_id!, id);
  }
}
