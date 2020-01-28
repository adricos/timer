import { Component, ViewChild, OnInit } from '@angular/core';
import { WorkOutEngine } from '../workoutengine';
import { StrideType } from '../stride';
import { PaceName } from '../pace';
import { GitFile } from '../git-file';

import { IonContent, IonSelect, IonVirtualScroll, IonButton } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';

import { Storage } from '@ionic/storage';
import { WorkOut } from '../workout';

declare var cordova;
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild("workouts", { static: false }) workouts: IonSelect;
  @ViewChild("scroll", { static: false }) scroll: IonVirtualScroll;
  @ViewChild("syncButton", { static: false }) syncButton: IonButton;
  @ViewChild("startButton", { static: false }) startButton: IonButton;


  paceName = PaceName;
  repo = 'https://api.github.com/repos/adricos/workouts/contents/files';
  workoutsArray: WorkOut[] = [];
  isSyncing: boolean;

  constructor(
    public engine: WorkOutEngine,
    private http: HTTP,
    private storage: Storage
  ) {
  }

  ngOnInit() {
    this.engine.segment$.subscribe((s: number) => this.scrollTo(s));

    this.storage.length().then((val) => {
      if (val === 0) {
        this.sync();
      } else {
        this.storage.get('workouts').then((val) => {
          this.workoutsArray = val;
        });
      }
    })


  }

  scrollTo(item: number): void {
    this.scroll.positionForItem(item).then(n => {
      this.content.scrollToPoint(0, n, 750)
    });
    ;
  }

  sync() {
    this.isSyncing = true;
    this.syncButton.disabled = true;
    this.startButton.disabled = true;
    this.workouts.disabled = false;

    this.http.get(this.repo, {}, {})
      .then(data => {
        let files = JSON.parse(data.data) as (GitFile[]);
        this.workoutsArray = [];
        var arr = [];

        files.forEach(f => {
          arr.push(this.http.get(f.download_url, {}, {}));
        });

        Promise.all(arr)
          .then(results => {
            results.forEach(r => {
              let workout = JSON.parse(r.data) as WorkOut;
              this.workoutsArray.push(workout);
            });
            if (this.workoutsArray.length > 0) {
              return this.storage.set("workouts", this.workoutsArray);
            }
          })
          .finally(() => {
            this.isSyncing = false;
            this.syncButton.disabled = false;
            this.startButton.disabled = false;
            this.workouts.disabled = false;
          })
      });
  }

  getWarningColor(value: number) {
    switch (value) {
      case 5:
        return '#FFFFF3';
      case 4:
        return '#FFFF9A';
      case 3:
        return '#FFFF58';
      case 2:
        return '#FFFF19';
      case 1:
        return '#FFFF00';
      default:
        return '#FFFFFF';
    }
  }

  loadWorkout($event) {
    this.startButton.disabled = false;
    this.engine.init(this.workoutsArray[$event.detail.value], StrideType.Jog);
  }

}
