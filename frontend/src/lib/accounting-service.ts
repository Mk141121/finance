import apiClient from './api-client';

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  entryType: 'manual' | 'auto_sales' | 'auto_purchase' | 'auto_inventory';
  status: 'draft' | 'posted' | 'reversed';
  description?: string;
  totalDebit: number;
  totalCredit: number;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  id?: string;
  lineNumber: number;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
}

export interface CreateJournalEntryDto {
  entryDate: string;
  description?: string;
  lines: Omit<JournalEntryLine, 'id' | 'accountName'>[];
}

export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  level: number;
  parentId?: string;
  normalBalance: 'debit' | 'credit';
  isDetail: boolean;
}

export const accountingService = {
  /**
   * Get all journal entries
   */
  async getAllJournalEntries(): Promise<JournalEntry[]> {
    const response = await apiClient.get<JournalEntry[]>('/accounting/journal-entries');
    return response.data;
  },

  /**
   * Get one journal entry
   */
  async getJournalEntry(id: string): Promise<JournalEntry> {
    const response = await apiClient.get<JournalEntry>(`/accounting/journal-entries/${id}`);
    return response.data;
  },

  /**
   * Create journal entry
   */
  async createJournalEntry(data: CreateJournalEntryDto): Promise<JournalEntry> {
    const response = await apiClient.post<JournalEntry>('/accounting/journal-entries', data);
    return response.data;
  },

  /**
   * Post journal entry
   */
  async postJournalEntry(id: string): Promise<JournalEntry> {
    const response = await apiClient.post<JournalEntry>(`/accounting/journal-entries/${id}/post`);
    return response.data;
  },

  /**
   * Delete journal entry
   */
  async deleteJournalEntry(id: string): Promise<void> {
    await apiClient.delete(`/accounting/journal-entries/${id}`);
  },

  /**
   * Get all accounts
   */
  async getAllAccounts(): Promise<ChartOfAccount[]> {
    const response = await apiClient.get<ChartOfAccount[]>('/accounting/accounts');
    return response.data;
  },

  /**
   * Get account by code
   */
  async getAccountByCode(code: string): Promise<ChartOfAccount> {
    const response = await apiClient.get<ChartOfAccount>(`/accounting/accounts/${code}`);
    return response.data;
  },
};
