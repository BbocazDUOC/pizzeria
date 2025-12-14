import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PizzasPage } from './pizzas.page';

describe('PizzasPage', () => {
  let component: PizzasPage;
  let fixture: ComponentFixture<PizzasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PizzasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
