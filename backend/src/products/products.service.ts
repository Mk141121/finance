import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as xlsx from 'xlsx';
import { Product } from './entities/product.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(query: QueryProductDto) {
    const { page = 1, limit = 20, search, categoryId, type, isActive } = query;

    const where: any = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [items, total] = await this.productRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto, userId: string) {
    // Check if code exists
    const existing = await this.productRepository.findOne({
      where: { code: createProductDto.code },
    });

    if (existing) {
      throw new ConflictException('Mã sản phẩm đã tồn tại');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.productRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const product = await this.findOne(id);

    Object.assign(product, updateProductDto, { updatedBy: userId });
    return await this.productRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return { message: 'Đã xóa sản phẩm thành công' };
  }

  /**
   * Soft delete product (alias for backward compatibility)
   */
  async delete(id: string, tenantId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Soft delete by updating deletedAt
    product.deletedAt = new Date();
    product.isActive = false;
    await this.productRepository.save(product);
  }

  async importFromExcel(file: any, userId: string) {
    if (!file) {
      throw new BadRequestException('File không được để trống');
    }

    try {
      // Read Excel file
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      const results = {
        totalRows: data.length,
        successCount: 0,
        errorCount: 0,
        errors: [],
      };

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rowNumber = i + 2; // Excel row number (header is row 1)

        try {
          // Validate required fields
          if (!row['Mã sản phẩm']) {
            throw new Error('Mã sản phẩm không được để trống');
          }

          if (!row['Tên sản phẩm']) {
            throw new Error('Tên sản phẩm không được để trống');
          }

          // Check if product exists
          const existing = await this.productRepository.findOne({
            where: { code: row['Mã sản phẩm'] },
          });

          const productData = {
            code: row['Mã sản phẩm'],
            name: row['Tên sản phẩm'],
            type: row['Loại'] || 'product',
            salePrice: parseFloat(row['Giá bán']) || 0,
            costPrice: parseFloat(row['Giá vốn']) || 0,
            vatRate: parseFloat(row['Thuế GTGT (%)']) || 10,
            revenueAccount: row['TK Doanh thu'] || '511',
            cogsAccount: row['TK Giá vốn'] || '632',
            inventoryAccount: row['TK Kho'] || '156',
            manageInventory: row['Quản lý kho'] !== 'Không',
            description: row['Ghi chú'] || '',
            isActive: row['Trạng thái'] !== 'Ngừng hoạt động',
          };

          if (existing) {
            // Update existing product
            Object.assign(existing, productData, { updatedBy: userId });
            await this.productRepository.save(existing);
          } else {
            // Create new product
            const product = this.productRepository.create({
              ...productData,
              createdBy: userId,
              updatedBy: userId,
            });
            await this.productRepository.save(product);
          }

          results.successCount++;
        } catch (error) {
          results.errorCount++;
          results.errors.push({
            row: rowNumber,
            code: row['Mã sản phẩm'],
            error: error.message,
          });
        }
      }

      // Generate error file if there are errors
      let errorFileUrl = null;
      if (results.errors.length > 0) {
        // In production, save to disk and return URL
        errorFileUrl = '/downloads/products_errors.xlsx';
      }

      return {
        ...results,
        errorFileUrl,
      };
    } catch (error) {
      throw new BadRequestException('Lỗi xử lý file Excel: ' + error.message);
    }
  }
}
