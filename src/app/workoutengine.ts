import { WorkOut } from './workout';
import { BehaviorSubject, Subject } from 'rxjs';
import { Segment } from './segment';
import { Stride } from './stride';
import { Injectable } from '@angular/core';
import { Pace } from './pace';

const circleR = 80;
const circleDasharray = 2 * Math.PI * circleR;

const segmentCircleR = 68;
const segmentCircleDasharray = 2 * Math.PI * segmentCircleR;

@Injectable()
export class WorkOutEngine {
    time: BehaviorSubject<string> = new BehaviorSubject('00:00');
    percentage: BehaviorSubject<number> = new BehaviorSubject(0);
    segmentTime: BehaviorSubject<string> = new BehaviorSubject('00:00');
    segmentPercentage: BehaviorSubject<number> = new BehaviorSubject(0);
    segmentElapsedTime: BehaviorSubject<number> = new BehaviorSubject(0);
    segment: Subject<number> = new Subject<number>();
    segment$ = this.segment.asObservable();

    segments: Segment[];
    stride: Stride;

    name: string;
    currentSegment: number;

    public duration: number;

    private timer: number;
    interval;

    circleR = circleR;
    circleDasharray = circleDasharray;

    segmentCircleR = segmentCircleR;
    segmentCircleDasharray = segmentCircleDasharray;

    public state: 'start' | 'stop' | 'pause' | 'end' = 'stop';

    constructor() {
    }

    public init(
        workOut: WorkOut,
        stride: Stride
    ) {
        this.segments = workOut.segments;
        this.name = workOut.name;
        this.stride = stride;
        this.duration = this.updateSegmentInteval();
        this.stopTimer();
    }

    public getSpeed(pace: Pace): number {
        if (this.stride && this.stride.values) {
            return this.stride.values[pace];
        }
        return 0;
    }
    
    private updateSegmentInteval(): number {
        let elapsedTime = 0;

        this.segments.forEach(s => {
            s.startTime = elapsedTime + 1;
            elapsedTime += s.time;
            s.endTime = elapsedTime;
            s.speed = this.getSpeed(s.pace);
        });

        return elapsedTime;
    }

    public toggleTimer() {
        if (this.state === 'start') {
            this.state = 'pause';
            clearInterval(this.interval);
        } else if (this.state === 'pause') {
            this.state = 'start';
            this.segments[this.currentSegment].completed = false;
            this.updateTimeValue();
            this.interval = setInterval(() => this.updateTimeValue(), 1000);
        } else {
            this.state = 'start';
            this.timer = 0;
            this.currentSegment = 0;
            this.segment.next(0);
            for (const s of this.segments) {
                s.completed = null;
            }
            this.segments[0].completed = false;
            this.updateTimeValue();
            this.interval = setInterval(() => this.updateTimeValue(), 1000);
        }
    }

    public stopTimer() {
        this.timer = 0;
        this.currentSegment = 0;
        this.segment.next(0);
        for (const s of this.segments) {
            s.completed = null;
        }
        clearInterval(this.interval);
        this.time.next('00:00');
        this.percentage.next(0);
        this.segmentPercentage.next(0);
        this.segmentElapsedTime.next(0);
        this.segmentTime.next('00:00');
        this.state = 'stop';
    }

    public current(): Segment {
        return typeof this.segments === 'undefined' || typeof this.segments[this.currentSegment] === 'undefined' ? 
            new Segment() : 
            this.segments[this.currentSegment];
    }

    public next(): Segment {
        return typeof this.segments === 'undefined' || typeof this.segments[this.currentSegment + 1] === 'undefined' ? 
            new Segment() : 
            this.segments[this.currentSegment + 1];
    }

    public percentageOffset(percent: number, circle: number) {
        return circle * percent / 100.0;
    }

    sToMMSS(s: number, delim = ':') {
        const showWith0 = (value: number) => value < 10 ? `0${value}` : value;
        const minutes = showWith0(Math.floor(s / 60));
        const seconds = showWith0(Math.floor((s % 60)));
        return `${minutes}${delim}${seconds}`;
    }

    public updateTimeValue(): void {
        const current = this.segments[this.currentSegment];
        const elapsedTime = current.endTime - this.timer;

        this.time.next(this.sToMMSS(this.timer));
        this.percentage.next(100 - this.timer * 100 / this.duration);

        this.segmentTime.next(this.sToMMSS(elapsedTime));
        this.segmentPercentage.next(elapsedTime * 100 / current.time);
        this.segmentElapsedTime.next(elapsedTime);


        ++this.timer;

        if (this.timer > current.endTime) {
            this.segments[this.currentSegment].completed = true;
            ++this.currentSegment;
            this.segment.next(this.currentSegment);
            if (this.currentSegment === this.segments.length) {
                this.state = 'end';
                clearInterval(this.interval);
            } else {
                this.segments[this.currentSegment].completed = false;
            }
        }
    }
}
