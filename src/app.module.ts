import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { MailerModule } from '@nestjs-modules/mailer';
import { resolve } from 'path';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    ConfigModule.load(resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('mailer'),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    PostModule,
  ],
})
export class AppModule {}
