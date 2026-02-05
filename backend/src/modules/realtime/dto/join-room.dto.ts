import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  room!: string;
}

export class JoinOrderRoomDto {
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;
}

export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  room!: string;
}
