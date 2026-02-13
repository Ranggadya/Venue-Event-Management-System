import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthApiController } from './auth-api.controller';

@Module({
  controllers: [AuthController, AuthApiController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
