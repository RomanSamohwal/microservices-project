import { IsString } from 'class-validator';
import { PurchaseState } from '@microservices-project/interfaces';

export namespace AccountChangedCourse {
  export const topic = 'account.change-course.event';

  export class Request {
    @IsString()
    userId!: string;
    @IsString()
    courseId!: string;
    @IsString()
    state!: PurchaseState;
  }
}
