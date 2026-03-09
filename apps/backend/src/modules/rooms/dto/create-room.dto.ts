import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(12)
  minPlayers?: number;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(12)
  maxPlayers?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  numImpostors?: number;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
