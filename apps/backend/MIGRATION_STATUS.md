# NestJS Migration Status

## ✅ Completed Tasks

### Phase 1: Project Initialization

- ✅ NestJS project created with CLI v11.0.14
- ✅ All core dependencies installed:
  - `@nestjs/platform-socket.io`, `@nestjs/websockets`, `socket.io`
  - `@nestjs/mongoose`, `mongoose`
  - `@nestjs/config`, `joi`
  - `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
  - `bcrypt`, `uuid`, `validator`
  - `class-validator`, `class-transformer`
  - `ioredis`, `@nestjs/throttler`
- ✅ Dev dependencies installed (TypeScript types, Husky, lint-staged)

### Phase 2: Development Tools

- ✅ ESLint configured with STRICT rules (no `any` allowed)
- ✅ Prettier configured
- ✅ Husky pre-commit hooks set up
- ✅ lint-staged configured

### Phase 3: Environment Configuration

- ✅ `.env.example` created
- ✅ `src/config/env.validation.ts` created with Joi schema

### Phase 4: TypeScript Types

- ✅ `src/types/user.types.ts` (UserPayload, JwtPayload, AuthResponse)
- ✅ `src/types/room.types.ts` (RoomStatus, RoomPlayer, RoomSettings, Room)
- ✅ `src/types/game.types.ts` (GamePhase, GamePlayer, GameClue, GameVotes, GameState)

### Phase 5: DTOs

- ✅ `src/modules/auth/dto/register.dto.ts`
- ✅ `src/modules/auth/dto/login.dto.ts`
- ✅ `src/modules/rooms/dto/create-room.dto.ts`
- ✅ `src/modules/rooms/dto/join-room.dto.ts`
- ✅ `src/modules/game/dto/submit-clue.dto.ts`
- ✅ `src/modules/game/dto/submit-vote.dto.ts`

### Phase 6: Database Schemas

- ✅ `src/database/schemas/user.schema.ts` (with bcrypt hashing, indexes)
- ✅ `src/database/schemas/room.schema.ts` (with indexes)

---

## 🔄 Remaining Tasks

### Phase 7: Repositories

Create repository pattern for data access:

**File: `src/database/repositories/user.repository.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UserPayload } from '../../types/user.types';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(username: string, email: string, password: string): Promise<UserDocument> {
    const user = new this.userModel({ username, email, password });
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }

  async updateSocketId(userId: string, socketId: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { socketId });
  }

  async updateCurrentRoom(userId: string, roomId: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { currentRoomId: roomId });
  }

  toPayload(user: UserDocument): UserPayload {
    return {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
  }
}
```

**File: `src/database/repositories/room.repository.ts`**

- Implement CRUD operations for rooms
- Methods: create, findById, findByCodePrefix, update, delete, etc.

**File: `src/database/database.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from './schemas/user.schema';
import { Room, RoomSchema } from './schemas/room.schema';
import { UserRepository } from './repositories/user.repository';
import { RoomRepository } from './repositories/room.repository';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  providers: [UserRepository, RoomRepository],
  exports: [UserRepository, RoomRepository],
})
export class DatabaseModule {}
```

### Phase 8: Common Utilities

Create shared utilities and guards:

**Directory structure:**

```-
src/common/
├── decorators/
│   └── current-user.decorator.ts
├── filters/
│   └── ws-exception.filter.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── ws-jwt.guard.ts
└── utils/
    ├── sanitizer.util.ts
    └── game-logic.util.ts
```

**File: `src/common/utils/sanitizer.util.ts`**

- Port functions from `backend/utils/sanitizer.js`
- sanitizeClue, sanitizeUsername, sanitizeEmail, sanitizeRoomName

**File: `src/common/utils/game-logic.util.ts`**

- Port word database from `backend/utils/gameLogic.js`
- Game logic functions with TypeScript types

**File: `src/common/guards/jwt-auth.guard.ts`**

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    return super.canActivate(context) as Promise<boolean>;
  }
}
```

**File: `src/common/guards/ws-jwt.guard.ts`**

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
```

### Phase 9: Authentication Module

Create complete auth module with JWT strategy:

**File: `src/modules/auth/strategies/jwt.strategy.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../../database/repositories/user.repository';
import { JwtPayload, UserPayload } from '../../../types/user.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.userRepository.toPayload(user);
  }
}
```

**Files to create:**

- `src/modules/auth/auth.module.ts` - Configure JWT, passport, exports
- `src/modules/auth/auth.service.ts` - Register, login, token generation
- `src/modules/auth/auth.controller.ts` - REST endpoints
- `src/modules/auth/auth.gateway.ts` - WebSocket auth namespace

### Phase 10: Rooms Module

**Files to create:**

- `src/modules/rooms/rooms.module.ts`
- `src/modules/rooms/rooms.service.ts` - Room CRUD, player management
- `src/modules/rooms/rooms.controller.ts` - REST endpoints
- `src/modules/rooms/rooms.gateway.ts` - WebSocket events, reconnection logic

### Phase 11: Game Module

**Files to create:**

- `src/modules/game/game.module.ts`
- `src/modules/game/game.service.ts` - Game state machine, phases, voting
- `src/modules/game/game.gateway.ts` - WebSocket game events

### Phase 12: Redis Module

**Files to create:**

- `src/modules/redis/redis.module.ts` - Global module
- `src/modules/redis/redis.service.ts` - Redis operations (set, get, del, setJson, getJson)

### Phase 13: Main Application

**File: `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { GameModule } from './modules/game/game.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    DatabaseModule,
    RedisModule,
    AuthModule,
    RoomsModule,
    GameModule,
  ],
})
export class AppModule {}
```

**File: `src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
```

### Phase 14: Testing

- Create unit tests for services
- Create integration tests for gateways
- E2E tests for complete game flow

---

## 📂 Current File Structure

```-
backend-new/
├── src/
│   ├── config/
│   │   └── env.validation.ts ✅
│   ├── database/
│   │   ├── schemas/
│   │   │   ├── user.schema.ts ✅
│   │   │   └── room.schema.ts ✅
│   │   └── repositories/
│   │       ├── user.repository.ts ⏳
│   │       └── room.repository.ts ⏳
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts ✅
│   │   │   │   └── login.dto.ts ✅
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts ⏳
│   │   │   ├── auth.module.ts ⏳
│   │   │   ├── auth.service.ts ⏳
│   │   │   ├── auth.controller.ts ⏳
│   │   │   └── auth.gateway.ts ⏳
│   │   ├── rooms/
│   │   │   ├── dto/
│   │   │   │   ├── create-room.dto.ts ✅
│   │   │   │   └── join-room.dto.ts ✅
│   │   │   ├── rooms.module.ts ⏳
│   │   │   ├── rooms.service.ts ⏳
│   │   │   ├── rooms.controller.ts ⏳
│   │   │   └── rooms.gateway.ts ⏳
│   │   ├── game/
│   │   │   ├── dto/
│   │   │   │   ├── submit-clue.dto.ts ✅
│   │   │   │   └── submit-vote.dto.ts ✅
│   │   │   ├── game.module.ts ⏳
│   │   │   ├── game.service.ts ⏳
│   │   │   └── game.gateway.ts ⏳
│   │   └── redis/
│   │       ├── redis.module.ts ⏳
│   │       └── redis.service.ts ⏳
│   ├── common/
│   │   ├── decorators/ ⏳
│   │   ├── filters/ ⏳
│   │   ├── guards/ ⏳
│   │   └── utils/ ⏳
│   ├── types/
│   │   ├── user.types.ts ✅
│   │   ├── room.types.ts ✅
│   │   └── game.types.ts ✅
│   ├── app.module.ts ⏳
│   └── main.ts ⏳
├── .env.example ✅
├── .prettierrc ✅
├── eslint.config.mjs ✅
├── package.json ✅
└── tsconfig.json ✅
```

Legend:

- ✅ Completed
- ⏳ Pending

---

## 🚀 Next Steps

1. **Create Repositories** - Implement UserRepository and RoomRepository
2. **Create Common Utilities** - Port sanitizer and game logic from old backend
3. **Create Guards** - JWT guards for HTTP and WebSocket
4. **Implement Auth Module** - Complete authentication with JWT strategy
5. **Implement Rooms Module** - Room management with reconnection logic
6. **Implement Game Module** - Game state machine and all phases
7. **Implement Redis Module** - Session management
8. **Configure Main App** - Update app.module.ts and main.ts
9. **Create .env** - Copy .env.example and fill with actual values
10. **Test** - Verify all functionality works

---

## 📝 Notes

- All TypeScript files use **strict typing** (no `any`)
- ESLint enforces explicit return types and no unused variables
- Pre-commit hooks run linting and formatting automatically
- Environment variables are validated on application startup
- MongoDB and Redis connections are required
- Port 3001 is used by default (configurable via .env)

---

## 🔗 Reference

- Original backend: `../backend/`
- Migration plan: `../.claude/plans/gleaming-snacking-lantern.md`
- NestJS docs: <https://docs.nestjs.com/>
- Socket.io with NestJS: <https://docs.nestjs.com/websockets/gateways>
