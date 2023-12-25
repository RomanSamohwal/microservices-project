import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { RMQService } from 'nestjs-rmq';
import { UserEntity } from './entities/user.entity';
import { IUser } from '@microservices-project/interfaces';
import { BuyCourseSaga } from './sagas/buy-course.saga';
import { UserEventEmitter } from './user.event-emitter';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly rmgService: RMQService,
    private readonly userEventEmitter: UserEventEmitter
  ) {
  }

  async changeProfile(user: Pick<IUser, 'displayName'>, id: string) {
    const existedUser = await this.userRepository.findUserById(id);

    if (!existedUser) {
      throw new Error('Такого пользователя не существует');
    }

    const userEntity = new UserEntity(existedUser).updateProfile(user.displayName);
    await this.updateUser(userEntity);
    return {};
  }

  async buyCourse(userId: string, courseId: string) {
    const existedUser = await this.userRepository.findUserById(userId);
    if (!existedUser) {
      throw new Error('Такого пользоавателя не существует');
    }
    const userEntity = new UserEntity(existedUser);
    const saga = new BuyCourseSaga(userEntity, courseId, this.rmgService);
    const { user, paymentLink } = await saga.getState().pay();
    await this.updateUser(user);
    return {
      paymentLink
    };
  }

  public async checkPayment(userId, courseId) {
    const existedUser = await this.userRepository.findUserById(userId);
    if (!existedUser) {
      throw new Error('Такого пользоавателя не существует');
    }
    const userEntity = new UserEntity(existedUser);
    const saga = new BuyCourseSaga(userEntity, courseId, this.rmgService);
    const { user, status } = await saga.getState().checkPayment();
    await this.updateUser(user);
    return { status };
  }

  private updateUser(user: UserEntity) {
    return Promise.all([
      this.userEventEmitter.handle(user),
      this.userRepository.updateUser(user)
    ]);
  }
}
