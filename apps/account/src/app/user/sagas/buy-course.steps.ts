import { BuyCourseSagaState } from './buy-course-saga.state';
import { UserEntity } from '../entities/user.entity';
import { CourseGetCourse, PaymentCheck, PaymentGenerateLink, PaymentStatus } from '@microservices-project/contracts';
import { PurchaseState } from '@microservices-project/interfaces';

export class BuyCourseSagaStateStarted extends BuyCourseSagaState {

  public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
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

  public async cancel(): Promise<{ user: UserEntity }> {
    this.saga.setState(PurchaseState.Canceled, this.saga.courseId);
    return { user: this.saga.user };
  }

  public checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Нельзя проверить платеж который не начался');
  }

}


export class BuyCourseSagaStateWaitingForPayment extends BuyCourseSagaState {
  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Нельзя отменить платеж в процессе');
  }

  public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    const { status } = await this.saga.rmqService.send<PaymentCheck.Request, PaymentCheck.Response>(PaymentCheck.topic, {
      userId: this.saga.user._id,
      courseId: this.saga.courseId
    });

    if (status === 'canceled') {
      this.saga.setState(PurchaseState.Canceled, this.saga.courseId)
      return {user: this.saga.user, status: 'canceled'}
    }

    if (status !== 'success') {
      return {user: this.saga.user, status: 'success'}
    }
   this.saga.setState(PurchaseState.Purchased, this.saga.courseId)
   return {user: this.saga.user, status: 'progress'}
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Нельзя создать ссылку на оплату в процессе');
  }

}

export class BuyCourseSagaStatePurchased extends BuyCourseSagaState {
  public cancel(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Нельзя отменить купленный курс');
  }

  public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Нельзя проверить платеж по купленному курсу');
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Нельзя отменить платеж в процессе');
  }

}


export class BuyCourseSagaStateCanceled extends BuyCourseSagaState {

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    this.saga.setState(PurchaseState.Started, this.saga.courseId)
    return this.saga.getState().pay()
  }

  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Нельзя отменить отмененный курс');
  }

  public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Нельзя проверить платеж по отмененному курсу');
  }

}
