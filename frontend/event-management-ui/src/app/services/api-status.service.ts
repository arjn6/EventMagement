import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiStatusService {
  private readonly _isDown = new BehaviorSubject<boolean>(false);
  readonly isDown$ = this._isDown.asObservable();

  markDown(): void {
    this._isDown.next(true);
  }

  markUp(): void {
    if (this._isDown.getValue()) {
      this._isDown.next(false);
    }
  }
}
