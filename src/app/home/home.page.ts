import { Component, ViewChild, OnInit } from '@angular/core';
import { WorkOutEngine } from '../workoutengine';
import { WorkOut } from '../workout';
import { StrideType } from '../stride';
import { PaceName } from '../pace';
import { IonContent } from '@ionic/angular';
import * as GoogleDrive  from 'cordova-plugin-jc-googledrive/www/GoogleDrive';

declare var cordova;
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild(IonContent, {static: false}) content: IonContent;

  paceName = PaceName;
  worOut: WorkOut = {
    name: 'Test WorkOut',
    segments: [
      { pace: 0, time: 3 },
      { pace: 1, time: 5 },
      { pace: 2, time: 4 },
      { pace: 3, time: 2 },
      { pace: 4, time: 2 },
      { pace: 5, time: 2 }
    ]
  };

  constructor(
    public engine: WorkOutEngine
  ) {
    engine.init(this.worOut, StrideType.Jog);
    engine.segment$.subscribe((s: number) => this.scrollTo(s));
  }

  ngOnInit() {

  }

  scrollTo(item: number): void {
    this.content.scrollToPoint(0, item * 49, 750);
  }

}
