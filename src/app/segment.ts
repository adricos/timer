import { Pace, PaceName } from './pace';
export class Segment {
    public pace: Pace;
    public time: number;
    public startTime?: number;
    public endTime?: number;
    public completed?: boolean = null;
    public speed?: number = null;
}
