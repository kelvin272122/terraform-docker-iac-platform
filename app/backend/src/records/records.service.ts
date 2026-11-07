import { ApiError } from '../api/errors.js';
import type { RecordItem, RecordsList } from './records.model.js';
import type { RecordsRepository } from './records.repository.js';
import { parseCreateRecordBody } from './records.validation.js';

export interface RecordsService {
  list(): Promise<RecordsList>;
  create(body: unknown): Promise<RecordItem>;
  remove(id: string): Promise<void>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createRecordsService(repository: RecordsRepository): RecordsService {
  return {
    list(): Promise<RecordsList> {
      return repository.list();
    },

    async create(body: unknown): Promise<RecordItem> {
      const input = parseCreateRecordBody(body);
      return repository.create(input);
    },

    async remove(id: string): Promise<void> {
      if (!UUID_PATTERN.test(id)) {
        throw ApiError.validation('El identificador no es un UUID válido.', {
          id: 'El identificador no es un UUID válido.',
        });
      }

      const deleted = await repository.remove(id.toLowerCase());
      if (!deleted) {
        throw ApiError.recordNotFound();
      }
    },
  };
}
