import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './models/user.model';
import { UserRepository } from './repositories/user.repository';
import { UserCommands } from './user.commands';
import { UserEventEmitter } from './user.event-emitter';
import { UserService } from './user.service';

@Module({
  imports: [MongooseModule.forFeature([
    { name: User.name, schema: UserSchema }
  ])],
  exports: [UserRepository],
  providers: [UserRepository, UserEventEmitter, UserService],
  controllers: [UserCommands]
})
export class UserModule {
}
