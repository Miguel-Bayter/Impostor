import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../database/repositories/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, UserPayload } from '../../types/user.types';
import { sanitizeEmail, sanitizeUsername } from '../../common/utils/sanitizer.util';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = sanitizeEmail(dto.email);
    const username = sanitizeUsername(dto.username);

    if (!email) {
      throw new ConflictException('Invalid email format');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const user = await this.userRepository.create(username, email, dto.password);
    const token = this.generateToken(user._id, user.username);

    return {
      user: this.userRepository.toPayload(user),
      token,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = sanitizeEmail(dto.email);
    if (!email) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.updateLastLogin(user._id);
    const token = this.generateToken(user._id, user.username);

    return {
      user: this.userRepository.toPayload(user),
      token,
    };
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user?: UserPayload }> {
    try {
      const decoded = this.jwtService.verify<{ userId: string; username: string }>(token);
      const user = await this.userRepository.findById(decoded.userId);

      if (!user || !user.isActive) {
        return { valid: false };
      }

      return {
        valid: true,
        user: this.userRepository.toPayload(user),
      };
    } catch {
      return { valid: false };
    }
  }

  private generateToken(userId: string, username: string): string {
    const payload = { userId, username, iat: Math.floor(Date.now() / 1000) };
    return this.jwtService.sign(payload);
  }
}
