import apiClient from './api-client';

export interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerId: string;
  customerName: string;
  status: 'draft' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items: SalesOrderItem[];
}

export interface SalesOrderItem {
  id?: string;
  lineNumber: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  lineAmount: number;
}

export interface CreateSalesOrderDto {
  orderDate: string;
  customerId: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items: Omit<SalesOrderItem, 'id'>[];
}

export const salesOrderService = {
  /**
   * Get all sales orders
   */
  async getAll(): Promise<SalesOrder[]> {
    const response = await apiClient.get<SalesOrder[]>('/sales-orders');
    return response.data;
  },

  /**
   * Get one sales order
   */
  async getOne(id: string): Promise<SalesOrder> {
    const response = await apiClient.get<SalesOrder>(`/sales-orders/${id}`);
    return response.data;
  },

  /**
   * Create sales order
   */
  async create(data: CreateSalesOrderDto): Promise<SalesOrder> {
    const response = await apiClient.post<SalesOrder>('/sales-orders', data);
    return response.data;
  },

  /**
   * Update sales order
   */
  async update(id: string, data: Partial<CreateSalesOrderDto>): Promise<SalesOrder> {
    const response = await apiClient.patch<SalesOrder>(`/sales-orders/${id}`, data);
    return response.data;
  },

  /**
   * Update status
   */
  async updateStatus(id: string, status: SalesOrder['status']): Promise<SalesOrder> {
    const response = await apiClient.patch<SalesOrder>(`/sales-orders/${id}/status`, { status });
    return response.data;
  },

  /**
   * Delete sales order
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/sales-orders/${id}`);
  },
};
