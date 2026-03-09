import { IsString, MaxLength } from 'class-validator';

export class SubmitClueDto {
  @IsString()
  roomId!: string;

  @IsString()
  @MaxLength(50)
  clue!: string;
}
