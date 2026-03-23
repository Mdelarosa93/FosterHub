import { IsEmail } from 'class-validator';

export class AssignWorkerDto {
  @IsEmail()
  email!: string;
}
