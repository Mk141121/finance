import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesOrderDto } from './create-sales-order.dto';
import { IsEnum } from 'class-validator';
import { SalesOrderStatus } from '../sales-order.entity';

export class UpdateSalesOrderDto extends PartialType(CreateSalesOrderDto) {}

export class UpdateSalesOrderStatusDto {
  @IsEnum(SalesOrderStatus)
  status: SalesOrderStatus;
}
