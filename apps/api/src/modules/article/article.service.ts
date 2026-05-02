import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ARTICLE_REPOSITORY } from 'src/constants/database.const';
import { PostgresProvider } from 'src/database/postgres.provider';
import { Article } from 'src/database/models/article.model';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly articleRepository: typeof Article,
    private readonly postgresProvider: PostgresProvider,
  ) {}

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }

  async findAll(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const articles = await this.articleRepository.findAll({
        order: [['created_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return articles;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const article = await this.articleRepository.findByPk(id, { transaction });
      if (!article) throw new NotFoundException('Artikel tidak ditemukan');
      await transaction.commit();
      return article;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findBySlug(tenantId: string, slug: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const article = await this.articleRepository.findOne({
        where: { slug },
        transaction,
      });
      if (!article) throw new NotFoundException('Artikel tidak ditemukan');
      await transaction.commit();
      return article;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(tenantId: string, dto: CreateArticleDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      
      let slug = this.slugify(dto.title);
      const existing = await this.articleRepository.findOne({
        where: { slug },
        transaction,
      });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }

      const article = await this.articleRepository.create(
        {
          ...dto,
          slug,
        },
        { transaction },
      );
      await transaction.commit();
      return article;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(tenantId: string, id: string, dto: UpdateArticleDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const article = await this.articleRepository.findByPk(id, { transaction });
      if (!article) throw new NotFoundException('Artikel tidak ditemukan');

      const updateData: any = { ...dto };
      if (dto.title && dto.title !== article.title) {
        let slug = this.slugify(dto.title);
        const existing = await this.articleRepository.findOne({
          where: { slug },
          transaction,
        });
        if (existing && existing.id !== id) {
          slug = `${slug}-${Date.now()}`;
        }
        updateData.slug = slug;
      }

      await article.update(updateData, { transaction });
      await transaction.commit();
      return article;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(tenantId: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const article = await this.articleRepository.findByPk(id, { transaction });
      if (!article) throw new NotFoundException('Artikel tidak ditemukan');
      await article.destroy({ transaction });
      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
