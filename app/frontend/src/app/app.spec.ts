import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, map, Observable } from 'rxjs';

import { App } from './app';
import { routes } from './app.routes';

interface BreakpointState {
  matches: boolean;
  breakpoints: Record<string, boolean>;
}

class BreakpointObserverStub {
  private readonly matches = new BehaviorSubject(true);

  observe(): Observable<BreakpointState> {
    return this.matches.pipe(
      map((matches) => ({ matches, breakpoints: {} })),
    );
  }

  isMatched(): boolean {
    return this.matches.value;
  }

  setMatches(value: boolean): void {
    this.matches.next(value);
  }
}

describe('App', () => {
  let breakpointObserver: BreakpointObserverStub;

  beforeEach(async () => {
    breakpointObserver = new BreakpointObserverStub();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: BreakpointObserver, useValue: breakpointObserver },
      ],
    }).compileComponents();
  });

  it('renders the application shell and navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const text = element.textContent ?? '';

    expect(text).not.toContain('Hello, iac-panel-frontend');
    expect(text).toContain('Panel de verificación IaC');
    expect(element.querySelector('a[href="/estado"]')?.textContent).toContain('Estado');
    expect(element.querySelector('a[href="/registros"]')?.textContent).toContain('Registros');
    expect(element.querySelector('mat-sidenav')?.getAttribute('aria-label')).toBe(
      'Navegación principal',
    );
    expect(element.querySelector('img[src="logo.svg"]')).not.toBeNull();
  });

  it('switches between desktop and mobile navigation and closes on navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('button[aria-label="Abrir navegación"]')).toBeNull();

    breakpointObserver.setMatches(false);
    await fixture.whenStable();
    fixture.detectChanges();

    const menuButton = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Abrir navegación"]',
    );
    expect(menuButton).not.toBeNull();
    expect(menuButton?.getAttribute('aria-expanded')).toBe('false');

    menuButton?.click();
    fixture.detectChanges();
    expect(menuButton?.getAttribute('aria-expanded')).toBe('true');

    await TestBed.inject(Router).navigateByUrl('/registros');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(menuButton?.getAttribute('aria-expanded')).toBe('false');

    breakpointObserver.setMatches(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('button[aria-label="Abrir navegación"]')).toBeNull();
  });
});
