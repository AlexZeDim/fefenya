import { SlashCommandBuilder } from '@discordjs/builders';
import { ISlashCommand, ISlashCommandArgs } from '@app/shared/interface';
import { FEFENYA_STORAGE_KEYS } from '@app/shared/enums';
import {
  fefenyaKeyFormatter,
  gotdGreeter,
  randInBetweenInt,
} from '@app/shared/utils';

export const gotdCommand: ISlashCommand = {
  name: 'gay',
  description: 'Choose hero of the day',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName('gay')
    .setDescription('Set up gay of the day'),

  async executeInteraction({
    interaction,
    redis,
    repository,
    logger,
  }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    try {
      logger.log('command is triggered');
      const isGotdTriggered = !!(await redis.exists(
        FEFENYA_STORAGE_KEYS.GOTD_TOD_STATUS,
      ));

      if (isGotdTriggered) {
        await interaction.reply({
          content: `Только раз в сутки!`,
          ephemeral: false,
        });

        return;
      }

      logger.debug(
        `Selecting gay lord of the day from: ${interaction.guild.id}`,
      );

      // const randIndex = randInBetweenInt(0, storage.length);

      const guildUserIdRandom = await redis.srandmember(
        fefenyaKeyFormatter(interaction.guild.id),
      );

      // const guildUserIdRandom = storage[randIndex];

      logger.log(`Fefenya pre-pick user gaylord: ${guildUserIdRandom}`);

      const gothUserEntity = await repository.findOneBy({
        id: guildUserIdRandom,
      });

      if (!gothUserEntity) {
        const guildMember = await interaction.guild.members.fetch(
          guildUserIdRandom,
        );

        const gothEntity = repository.create({
          id: guildUserIdRandom,
          name: guildMember.displayName,
          count: 1,
          guildId: interaction.guildId,
        });

        await repository.save(gothEntity);
      } else {
        await repository.update(
          { id: guildUserIdRandom },
          { count: gothUserEntity.count + 1 },
        );
      }

      await redis.set(FEFENYA_STORAGE_KEYS.GOTD_TOD_STATUS, 1);

      logger.log(gotdGreeter(guildUserIdRandom));

      await interaction.reply({
        content: gotdGreeter(guildUserIdRandom),
        ephemeral: false,
      });
    } catch (errorOrException) {
      console.error(errorOrException);
      await interaction.reply({
        content: errorOrException.message,
        ephemeral: true,
      });
    }
  },
};
