import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { RoomsModule } from '../rooms/rooms.module';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [
    DatabaseModule,
    RoomsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return {
          secret,
          signOptions: {
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '24h') as
              | `${number}h`
              | `${number}d`,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}
