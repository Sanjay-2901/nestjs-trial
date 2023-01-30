import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  //////////////////////////////////////////////////////////////////////////////////////////////////
  async signup(dto: AuthDto) {
    const hashedPassword = await argon.hash(dto.password); // encrypting the password using argon

    try {
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          password: hashedPassword, // creating the user using prisma witihin try method since it has chances to fail.
        },
      });
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // checking whether the error is from PrismaClientRequestError.
        if (error.code == 'P2002') {
          // If yes, checking the error code. Refer prisma docs for more error codes.
          throw new ForbiddenException('Credentials Taken'); // If yes, throwing ForbiddenException of nestJs.
        }
      }
      throw error; // If the error is not from prisma, throw the error simply.
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  async login(dto: AuthDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email, // Finding the user from the DB.
      },
    });

    if (!user) {
      throw new ForbiddenException('Email does not exist'); //If the user variable is empty, email is wrong.
    }

    const pwMatches = await argon.verify(user.password, dto.password); //Else, check for password using argon verify which returns bool.

    if (!pwMatches) {
      throw new ForbiddenException('Incorrect Password'); //If false throw Forbidden
    }

    return this.signToken(user.id, user.email); // Else, return user, user is logged in.
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////

  signToken(userId: number, email: string): Promise<any> {
    const payload = {
      sub: userId,
      email,
    };

    const secretKey = this.config.get('JWT_SECRET');

    const token = this.jwt.signAsync(payload, {
      expiresIn: '100m',
      secret: secretKey,
    });

    return token;
  }
}
