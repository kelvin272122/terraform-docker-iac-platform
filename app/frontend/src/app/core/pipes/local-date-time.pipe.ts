import { Pipe, type PipeTransform } from '@angular/core';

const LOCAL_DATE_TIME_FORMAT = new Intl.DateTimeFormat('es', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

@Pipe({
  name: 'localDateTime',
  standalone: true,
})
export class LocalDateTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Fecha no válida';
    }

    return LOCAL_DATE_TIME_FORMAT.format(date);
  }
}
