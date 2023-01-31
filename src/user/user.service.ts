import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEditDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  editUser(userId: number, dto: UserEditDto) {
    const editedUser = this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
    });
    return editedUser;
  }
}
