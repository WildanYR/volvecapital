import { Module } from '@nestjs/common';
import { ARTICLE_REPOSITORY } from 'src/constants/database.const';
import { Article } from 'src/database/models/article.model';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';

@Module({
  controllers: [ArticleController],
  providers: [
    ArticleService,
    {
      provide: ARTICLE_REPOSITORY,
      useValue: Article,
    },
  ],
  exports: [ArticleService],
})
export class ArticleModule {}
