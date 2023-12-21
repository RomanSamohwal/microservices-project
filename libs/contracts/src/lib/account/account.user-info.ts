import { IsString } from 'class-validator';
import { IUser } from '@microservices-project/interfaces';

export namespace AccountUserInfo {
  export const topic = 'account.user-info.query';

  export class Request {
    @IsString()
    id!: string;
  }

  export class Response {
    user!: Omit<IUser, 'passwordHash'>;
  }
}
