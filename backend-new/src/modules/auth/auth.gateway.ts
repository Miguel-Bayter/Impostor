import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@WebSocketGateway({ namespace: '/auth', cors: true })
export class AuthGateway {
  constructor(private authService: AuthService) {}

  @SubscribeMessage('auth:register')
  async handleRegister(
    @MessageBody() dto: RegisterDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const result = await this.authService.register(dto);
      client.emit('auth:register:success', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      client.emit('auth:error', { message: errorMessage });
    }
  }

  @SubscribeMessage('auth:login')
  async handleLogin(
    @MessageBody() dto: LoginDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const result = await this.authService.login(dto);
      client.emit('auth:login:success', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      client.emit('auth:error', { message: errorMessage });
    }
  }
}
