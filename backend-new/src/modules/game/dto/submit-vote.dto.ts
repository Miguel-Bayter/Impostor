import { IsString } from 'class-validator';

export class SubmitVoteDto {
  @IsString()
  roomId!: string;

  @IsString()
  votedPlayerId!: string;
}
