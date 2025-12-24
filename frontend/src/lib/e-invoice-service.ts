import apiClient from './api-client';

export interface EInvoice {
  id: string;
  invoiceNumber: string;
  invoiceSeries: string;
  templateCode: string;
  invoiceType: 'vat_invoice' | 'sales_invoice' | 'export_invoice';
  invoiceStatus: 'draft' | 'issued' | 'sent' | 'signed' | 'cancelled' | 'replaced';
  invoiceDate: string;
  issueDate?: string;
  customerName: string;
  customerTaxCode?: string;
  customerEmail?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountInWords?: string;
  lookupCode?: string;
  items: EInvoiceItem[];
}

export interface EInvoiceItem {
  id?: string;
  lineNumber: number;
  productName: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface CreateEInvoiceDto {
  invoiceSeries: string;
  templateCode: string;
  invoiceType: EInvoice['invoiceType'];
  invoiceDate: string;
  customerId: string;
  customerName: string;
  customerTaxCode?: string;
  customerEmail?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: Omit<EInvoiceItem, 'id'>[];
}

export interface IssueEInvoiceDto {
  signerName: string;
  lookupCode?: string;
}

export const eInvoiceService = {
  /**
   * Get all e-invoices
   */
  async getAll(): Promise<EInvoice[]> {
    const response = await apiClient.get<EInvoice[]>('/e-invoices');
    return response.data;
  },

  /**
   * Get one e-invoice
   */
  async getOne(id: string): Promise<EInvoice> {
    const response = await apiClient.get<EInvoice>(`/e-invoices/${id}`);
    return response.data;
  },

  /**
   * Create e-invoice
   */
  async create(data: CreateEInvoiceDto): Promise<EInvoice> {
    const response = await apiClient.post<EInvoice>('/e-invoices', data);
    return response.data;
  },

  /**
   * Issue e-invoice (generate XML and sign)
   */
  async issue(id: string, data: IssueEInvoiceDto): Promise<EInvoice> {
    const response = await apiClient.post<EInvoice>(`/e-invoices/${id}/issue`, data);
    return response.data;
  },

  /**
   * Send e-invoice to customer
   */
  async send(id: string): Promise<EInvoice> {
    const response = await apiClient.post<EInvoice>(`/e-invoices/${id}/send`);
    return response.data;
  },

  /**
   * Cancel e-invoice
   */
  async cancel(id: string, reason: string): Promise<EInvoice> {
    const response = await apiClient.post<EInvoice>(`/e-invoices/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Download XML file
   */
  async downloadXml(id: string, signed: boolean = false): Promise<string> {
    const endpoint = signed ? `/e-invoices/${id}/xml/signed` : `/e-invoices/${id}/xml`;
    const response = await apiClient.get<string>(endpoint);
    return response.data;
  },

  /**
   * Delete draft invoice
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/e-invoices/${id}`);
  },
};
