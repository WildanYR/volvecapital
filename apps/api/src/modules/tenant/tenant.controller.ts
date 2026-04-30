import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { PublicRoute } from 'src/guards/public-route.decorator';
import { AtLeastOnePropertyPipe } from 'src/pipes/at-least-one-property.pipe';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { GetAllTenantQueryUrlDto } from './dto/get-all-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantService } from './tenant.service';
import { VcAuthGuard } from 'src/guards/vc-auth.guard';

@Controller('tenant')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(@Query() query: GetAllTenantQueryUrlDto) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.tenantService.findAll(pagination, filter);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  update(
    @Param('id') tenantId: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantService.update(tenantId, updateTenantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') tenantId: string) {
    return this.tenantService.remove(tenantId);
  }

  @UseGuards(VcAuthGuard)
  @Patch('owner/change-password')
  async changePassword(@Request() req: any, @Body() data: any) {
    const ownerId = req.user?.id;
    return await this.tenantService.changePassword(ownerId, data);
  }

  @PublicRoute()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.tenantService.login(loginDto);
  }
}
