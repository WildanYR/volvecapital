import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TUTORIAL_REPOSITORY } from 'src/constants/database.const';
import { PostgresProvider } from 'src/database/postgres.provider';
import { Tutorial } from 'src/database/models/tutorial.model';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';

@Injectable()
export class TutorialService {
  constructor(
    @Inject(TUTORIAL_REPOSITORY)
    private readonly tutorialRepository: typeof Tutorial,
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
      const tutorials = await this.tutorialRepository.findAll({
        order: [['created_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return tutorials;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const tutorial = await this.tutorialRepository.findByPk(id, { transaction });
      if (!tutorial) throw new NotFoundException('Tutorial tidak ditemukan');
      await transaction.commit();
      return tutorial;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(tenantId: string, dto: CreateTutorialDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      
      let slug = this.slugify(dto.title);
      // Check if slug exists
      const existing = await this.tutorialRepository.findOne({
        where: { slug },
        transaction,
      });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }

      const tutorial = await this.tutorialRepository.create(
        {
          ...dto,
          slug,
        },
        { transaction },
      );
      await transaction.commit();
      return tutorial;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(tenantId: string, id: string, dto: UpdateTutorialDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const tutorial = await this.tutorialRepository.findByPk(id, { transaction });
      if (!tutorial) throw new NotFoundException('Tutorial tidak ditemukan');

      const updateData: any = { ...dto };
      if (dto.title && dto.title !== tutorial.title) {
        let slug = this.slugify(dto.title);
        const existing = await this.tutorialRepository.findOne({
          where: { slug },
          transaction,
        });
        if (existing && existing.id !== id) {
          slug = `${slug}-${Date.now()}`;
        }
        updateData.slug = slug;
      }

      await tutorial.update(updateData, { transaction });
      await transaction.commit();
      return tutorial;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(tenantId: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const tutorial = await this.tutorialRepository.findByPk(id, { transaction });
      if (!tutorial) throw new NotFoundException('Tutorial tidak ditemukan');
      await tutorial.destroy({ transaction });
      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
