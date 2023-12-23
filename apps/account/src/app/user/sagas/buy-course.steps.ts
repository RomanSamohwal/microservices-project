import { BuyCourseSagaState } from './buy-course-saga.state';
import { UserEntity } from '../entities/user.entity';
import { CourseGetCourse, PaymentGenerateLink } from '@microservices-project/contracts';
import { PurchaseState } from '@microservices-project/interfaces';

export class BuyCourseSagaStateStarted extends BuyCourseSagaState {

  async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    const { course } = await this.saga.rmqService.send<CourseGetCourse.Request, CourseGetCourse.Response>(CourseGetCourse.topic,
      {
        id: this.saga.courseId
      });

    if (!course) {
      throw new Error('Такого курса не существует');
    }

    if (course.price === 0) {
      this.saga.setState(PurchaseState.Purchased, this.saga.courseId);
      return {
        paymentLink: null,
        user: this.saga.user
      };
    }

    const { paymentLink } = await this.saga.rmqService.send<PaymentGenerateLink.Request, PaymentGenerateLink.Response>(PaymentGenerateLink.topic,
      {
        courseId: this.saga.courseId,
        sum: course.price,
        userId: this.saga.user._id
      });

    this.saga.setState(PurchaseState.WaitingForPayment, course._id);
    return {
      paymentLink,
      user: this.saga.user
    };
  }

  async cancel(): Promise<{ user: UserEntity }> {
    this.saga.setState(PurchaseState.Canceled, this.saga.courseId);
    return { user: this.saga.user };
  }

  checkPayment(): Promise<{ user: UserEntity }> {
    throw new Error('Нельзя проверить платеж который не начался');
  }

}
