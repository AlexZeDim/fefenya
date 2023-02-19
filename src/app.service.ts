import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Client, Collection, Events, Partials, REST } from 'discord.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GatewayIntentBits, Routes } from 'discord-api-types/v10';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  CoreUsersEntity,
  GothEntity,
  GuildsEntity,
  UsersEntity,
} from '@app/pg';

import {
  FEFENYA_STORAGE_KEYS,
  fefenyaKeyFormatter,
  gotdCommand,
  GotsStatsCommand,
  ISlashCommand,
} from '@app/shared';

import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppService.name, { timestamp: true });
  private client: Client;
  private fefenyaUser: CoreUsersEntity;
  private commandsMessage: Collection<string, ISlashCommand> = new Collection();
  private commandSlash = [];
  private readonly rest = new REST({ version: '10' });

  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(GuildsEntity)
    private readonly guildsRepository: Repository<GuildsEntity>,
    @InjectRepository(CoreUsersEntity)
    private readonly coreUsersRepository: Repository<CoreUsersEntity>,
    @InjectRepository(GothEntity)
    private readonly gothRepository: Repository<GothEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      this.client = new Client({
        partials: [Partials.User, Partials.Channel, Partials.GuildMember],
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildPresences,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers,
        ],
        presence: {
          status: 'online',
        },
      });

      await this.loadFefenya();

      await this.loadCommands();

      await this.bot();
    } catch (errorOrException) {
      this.logger.error(`Application: ${errorOrException}`);
    }
  }

  private async loadFefenya(): Promise<void> {
    try {
      const fefenyaUserEntity = await this.coreUsersRepository.findOneBy({
        name: 'Fefenya',
      });

      if (!fefenyaUserEntity) throw new NotFoundException('Fefenya not found!');

      if (!fefenyaUserEntity.token)
        throw new NotFoundException('Fefenya token not found!');

      this.fefenyaUser = fefenyaUserEntity;

      await this.client.login(this.fefenyaUser.token);
      this.rest.setToken(this.fefenyaUser.token);
    } catch (errorOrException) {
      this.logger.error(`loadFefenya: ${errorOrException}`);
    }
  }

  private async loadCommands(): Promise<void> {
    this.commandsMessage.set(GotsStatsCommand.name, GotsStatsCommand);
    this.commandSlash.push(GotsStatsCommand.slashCommand.toJSON());
    this.commandsMessage.set(gotdCommand.name, gotdCommand);
    this.commandSlash.push(gotdCommand.slashCommand.toJSON());

    await this.rest.put(Routes.applicationCommands(this.client.user.id), {
      body: this.commandSlash,
    });

    this.logger.log('Commands updated');
  }

  async bot(): Promise<void> {
    try {
      this.client.on(Events.ClientReady, async () =>
        this.logger.log(`Logged in as ${this.client.user.tag}!`),
      );

      this.client.on(Events.GuildCreate, async (guild): Promise<void> => {
        try {
          for (const [userId, GuildMember] of guild.members.cache.entries()) {
            if (!GuildMember.user.bot)
              this.redisService.sadd(fefenyaKeyFormatter(guild.id), userId);
          }
        } catch (errorException) {
          this.logger.error(errorException);
        }
      });

      this.client.on(
        Events.InteractionCreate,
        async (interaction): Promise<void> => {
          if (interaction.isChatInputCommand()) {
            try {
              const command = this.commandsMessage.get(interaction.commandName);
              if (!command) return;
              await command.executeInteraction({
                interaction,
                repository: this.gothRepository,
                redis: this.redisService,
                logger: this.logger,
              });
            } catch (errorException) {
              this.logger.error(errorException);
              await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
              });
            }
          }
        },
      );

      this.client.on(Events.MessageCreate, async (message) => {
        try {
          if (message.author.bot) return;

          await this.redisService.sadd(
            fefenyaKeyFormatter(message.guildId),
            message.member.user.id,
          );
        } catch (errorException) {
          this.logger.error(errorException);
        }
      });
    } catch (errorOrException) {
      this.logger.error(`Fefenya: ${errorOrException}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async idleReaction() {
    try {
      const isGotdTriggered = !!(await this.redisService.exists(
        FEFENYA_STORAGE_KEYS.GOTD_TOD_STATUS,
      ));
      if (!isGotdTriggered) {
        // TODO if not triggered, add flag and link stats with finding a gay
        this.logger.debug(`isGotdTriggered: ${isGotdTriggered}`);
      } else {
        this.redisService.del(FEFENYA_STORAGE_KEYS.GOTD_TOD_STATUS);
      }
      return isGotdTriggered;
    } catch (e) {
      console.error(e);
    }
  }
}
