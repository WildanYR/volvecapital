import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Put,
  Post,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { RequirePermissions } from 'src/guards/permissions.decorator';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @RequirePermissions('content.view')
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.articleService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions('content.view')
  findOne(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.articleService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions('content.edit')
  create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateArticleDto,
  ) {
    return this.articleService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions('content.edit')
  update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articleService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('content.edit')
  remove(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.articleService.delete(tenantId, id);
  }
}
