import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './models/user.model';
import { UserRepository } from './repositories/user.repository';
import { UserCommands } from './user.commands';

@Module({
  imports: [MongooseModule.forFeature([
    { name: User.name, schema: UserSchema }
  ])],
  exports: [UserRepository],
  providers: [UserRepository],
  controllers: [UserCommands]
})
export class UserModule {
}
