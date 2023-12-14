import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IUser, UserRole } from '@microservices-project/interfaces';

@Schema()
export class User extends Document implements IUser {
  @Prop()
  displayName?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, enum: UserRole, type: String, default: UserRole.Student })
  role: UserRole;

  @Prop({ required: true })
  passwordHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
