import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    nickname,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const emailExists = await this.users.findOne({ email });
      if (emailExists) {
        return {
          ok: false,
          error: 'There is a user with that email already',
        };
      }
      const nicknameExists = await this.users.findOne({ nickname });
      if (nicknameExists) {
        return {
          ok: false,
          error: 'There is a user with that nickname already',
        };
      }
      const user = await this.users.save(
        this.users.create({ email, password, nickname }),
      );
      // TODO: send verification code
      this.mailService.sendVerificationEmail(user.email);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong password',
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Can't log user in.",
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });

      return {
        ok: true,
        user: user,
      };
    } catch (error) {
      return { ok: false, error: 'User Not Found' };
    }
  }

  async editProfile(
    userId: number,
    { email, password, nickname }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const emailExists = await this.users.findOne({ email });
      if (emailExists) {
        return {
          ok: false,
          error: 'There is a user with that email already',
        };
      }
      const nicknameExists = await this.users.findOne({ nickname });
      if (nicknameExists) {
        return {
          ok: false,
          error: 'There is a user with that nickname already',
        };
      }
      const user = await this.users.findOne(userId);
      if (email) {
        user.email = email;
        user.verified = false;
        // TODO: send verify email
      }
      if (password) {
        user.password = password;
      }
      if (nickname) {
        user.nickname = nickname;
      }
      await this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: 'Could not update profile.' };
    }
  }
}
