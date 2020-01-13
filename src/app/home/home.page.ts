import { Component } from '@angular/core';
import { WorkOutEngine } from '../workoutengine';
import { WorkOut } from '../workout';
import { Stride, StrideType } from '../stride';
import { PaceName } from '../pace';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  paceName = PaceName;
  engine: WorkOutEngine;
  worOut: WorkOut = {
    name: 'Test WorkOut',
    segments: [
      { pace: 0, time: 3 },
      { pace: 1, time: 5 },
      { pace: 2, time: 4 },
      { pace: 3, time: 6 }
    ]
  };

  constructor() {
    this.engine = new WorkOutEngine(this.worOut, StrideType.Jog);
  }

}
