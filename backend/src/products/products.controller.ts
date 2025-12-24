import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm' })
  async findAll(@Query() query: QueryProductDto) {
    const data = await this.productsService.findAll(query);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  async findOne(@Param('id') id: string) {
    const data = await this.productsService.findOne(id);
    return {
      success: true,
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Tạo sản phẩm mới' })
  async create(@Body() createProductDto: CreateProductDto, @Request() req) {
    const data = await this.productsService.create(
      createProductDto,
      req.user.userId,
    );
    return {
      success: true,
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req,
  ) {
    const data = await this.productsService.update(
      id,
      updateProductDto,
      req.user.userId,
    );
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa sản phẩm' })
  async remove(@Param('id') id: string) {
    const data = await this.productsService.remove(id);
    return {
      success: true,
      data,
    };
  }

  @Post('import')
  @ApiOperation({ summary: 'Import sản phẩm từ Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: any,
    @Request() req,
  ) {
    const data = await this.productsService.importFromExcel(
      file,
      req.user.userId,
    );
    return {
      success: true,
      data,
    };
  }
}
