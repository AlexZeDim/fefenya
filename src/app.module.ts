import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChannelsEntity,
  CoreUsersEntity,
  GothEntity,
  GuildsEntity,
  PermissionsEntity,
  RolesEntity,
  UserPermissionsEntity,
  UsersEntity,
} from '@app/pg';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      logging: true,
      entities: [
        GothEntity,
        ChannelsEntity,
        GuildsEntity,
        UsersEntity,
        RolesEntity,
        CoreUsersEntity,
        PermissionsEntity,
        UserPermissionsEntity,
      ],
      synchronize: false,
      keepConnectionAlive: true,
      ssl: null,
    }),
    TypeOrmModule.forFeature([
      GothEntity,
      ChannelsEntity,
      GuildsEntity,
      UsersEntity,
      RolesEntity,
      CoreUsersEntity,
      PermissionsEntity,
      UserPermissionsEntity,
    ]),
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        // password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
