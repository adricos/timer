import { Component, ViewChild } from '@angular/core';
import { IonContent, IonSelect, IonVirtualScroll, IonButton } from '@ionic/angular';
import { Storage } from '@ionic/storage';

import { HTTP } from '@ionic-native/http/ngx';
import { NativeAudio } from '@ionic-native/native-audio/ngx';

import { WorkoutEngine } from '../workoutengine';
import { StrideType } from '../stride';
import { PaceName } from '../pace';
import { GitFile } from '../git-file';
import { Workout } from '../workout';

import { Chart } from 'chart.js';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild("workouts", { static: false }) workouts: IonSelect;
  @ViewChild("scroll", { static: false }) scroll: IonVirtualScroll;
  @ViewChild("syncButton", { static: false }) syncButton: IonButton;
  @ViewChild("startButton", { static: false }) startButton: IonButton;
  @ViewChild('chart', { static: false }) chart: Chart;

  bars: any;
  colorArray: any;

  paceName = PaceName;
  repo = 'https://api.github.com/repos/adricos/workouts/contents/files';
  workoutsArray: Workout[] = [];
  isSyncing: boolean;

  constructor(
    public engine: WorkoutEngine,
    private http: HTTP,
    private storage: Storage,
    private nativeAudio: NativeAudio
  ) {
    this.engine.segment$.subscribe((s: number) => this.scrollTo(s));
  }

  ionViewDidLoad() {

  }

  ionViewDidEnter() {
    this.nativeAudio.preloadSimple('1', 'assets/audio/1.mp3').catch((e) => console.log(e));
    this.nativeAudio.preloadSimple('2', 'assets/audio/2.mp3').catch((e) => console.log(e));
    this.nativeAudio.preloadSimple('3', 'assets/audio/3.mp3').catch((e) => console.log(e));
    this.nativeAudio.preloadSimple('4', 'assets/audio/4.mp3').catch((e) => console.log(e));
    this.nativeAudio.preloadSimple('5', 'assets/audio/5.mp3').catch((e) => console.log(e));    
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
    this.scroll.positionForItem(item).then(n => this.content.scrollToPoint(0, n, 750));
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
              let workout = JSON.parse(r.data) as Workout;
              this.workoutsArray.push(workout);
            });
            if (this.workoutsArray.length > 0) {
              
              return this.storage.set("workouts", this.workoutsArray.sort(function(a, b) {
                var nameA = a.name.toUpperCase();
                var nameB = b.name.toUpperCase(); 
                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }
                return 0;
              }));
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
        this.nativeAudio.play('5');
        return '#FFFFF3';
      case 4:
        this.nativeAudio.play('4');
        return '#FFFF9A';
      case 3:
        this.nativeAudio.play('3');
        return '#FFFF58';
      case 2:
        this.nativeAudio.play('2');
        return '#FFFF19';
      case 1:
        this.nativeAudio.play('1');
        return '#FFFF00';
      default:
        return '#FFFFFF';
    }
  }

  loadWorkout($event) {
    this.startButton.disabled = false;
    this.engine.init(this.workoutsArray[$event.detail.value], StrideType.Jog);
    this.createBarChart(this.engine.segmentsGraph);
  }

  stopTimer(){
    this.engine.stopTimer();
    this.createBarChart(this.engine.segmentsGraph);
  }

  createBarChart(speeds: number[]) {
    let labels = [];
    for (let i = 0; i < speeds.length; i++) {
      labels.push('');
    }
    labels.push('');
    speeds.push(0);
    this.bars = new Chart(this.chart.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: speeds,
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: 'rgb(38, 194, 129)',
          borderWidth: 3,
          pointBackgroundColor: 'rgba(0, 0, 0, 0)',
          pointBorderColor: 'rgba(0, 0, 0, 0)',
        }]
      },
      options: {
        tooltips: {
          enabled: false
        },
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            display: false
          }],
          yAxes: [{
            display: true,
            gridLines:{
              drawBorder: false
            },
            ticks: {
              display: false,
              suggestedMin: 0
            }
          }]
        }
      }
    });

    this.bars.canvas.style.width = '95vw';
    this.bars.canvas.style.height = '32vw';
    this.bars.canvas.style.marginLeft = "auto";
    this.bars.canvas.style.marginRight = "auto";
  }

}
