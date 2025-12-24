import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';
import { IsEnum } from 'class-validator';
import { PurchaseOrderStatus } from '../purchase-order.entity';

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {}

export class UpdatePurchaseOrderStatusDto {
  @IsEnum(PurchaseOrderStatus)
  status: PurchaseOrderStatus;
}
