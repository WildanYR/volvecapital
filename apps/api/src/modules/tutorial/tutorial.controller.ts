import { Body, Controller, Delete, Get, Param, Post, Put, Request } from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { TutorialService } from './tutorial.service';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';
import { RequirePermissions } from 'src/guards/permissions.decorator';

@Controller('tutorial')
export class TutorialController {
  constructor(private readonly tutorialService: TutorialService) {}

  @Get()
  @RequirePermissions('content.view')
  findAll(@Request() request: AppRequest) {
    return this.tutorialService.findAll(request.tenant_id!);
  }

  @Get(':id')
  @RequirePermissions('content.view')
  findOne(@Param('id') id: string, @Request() request: AppRequest) {
    return this.tutorialService.findOne(request.tenant_id!, id);
  }

  @Post()
  @RequirePermissions('content.edit')
  create(@Body() dto: CreateTutorialDto, @Request() request: AppRequest) {
    return this.tutorialService.create(request.tenant_id!, dto);
  }

  @Put(':id')
  @RequirePermissions('content.edit')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTutorialDto,
    @Request() request: AppRequest,
  ) {
    return this.tutorialService.update(request.tenant_id!, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('content.edit')
  delete(@Param('id') id: string, @Request() request: AppRequest) {
    return this.tutorialService.delete(request.tenant_id!, id);
  }
}
