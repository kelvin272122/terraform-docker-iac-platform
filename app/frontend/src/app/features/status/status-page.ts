import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

interface StatusCard {
  readonly title: string;
  readonly value: string;
  readonly description: string;
}

@Component({
  selector: 'app-status-page',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './status-page.html',
  styleUrl: './status-page.scss',
})
export class StatusPage {
  protected readonly cards: readonly StatusCard[] = [
    {
      title: 'Entorno',
      value: 'Pendiente de integración',
      description: 'El entorno se obtendrá del backend al integrar la API.',
    },
    {
      title: 'Versión de la interfaz',
      value: 'Pendiente',
      description: 'La versión se tomará de la compilación en una etapa posterior.',
    },
    {
      title: 'API',
      value: 'Sin comprobaciones realizadas',
      description: 'La disponibilidad se comprobará cuando exista integración.',
    },
    {
      title: 'PostgreSQL',
      value: 'Sin comprobaciones realizadas',
      description: 'La disponibilidad se comprobará cuando exista integración.',
    },
  ];
}
