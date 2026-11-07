export interface RecordItem {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly createdAt: string;
}

export interface CreateRecordInput {
  readonly title: string;
  readonly description: string | null;
}

export interface RecordsList {
  readonly items: readonly RecordItem[];
  readonly total: number;
}
