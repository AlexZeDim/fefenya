import { SlashCommandBuilder } from '@discordjs/builders';
import { ISlashCommand, ISlashCommandArgs } from '@app/shared/interface';
import { EmbedBuilder } from 'discord.js';
import { FEFENYA_COMMANDS, FEFENYA_DESCRIPTION } from '@app/shared/enums';

export const GotsStatsCommand: ISlashCommand = {
  name: FEFENYA_COMMANDS.GOTS_STATS,
  description: FEFENYA_DESCRIPTION.GOTD_STATS,
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName(FEFENYA_COMMANDS.GOTS_STATS)
    .setDescription(FEFENYA_DESCRIPTION.GOTD_STATS),

  async executeInteraction({
    interaction,
    repository,
  }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    try {
      const gothHallOfGlory = await repository.find({
        where: { guildId: interaction.guildId },
        take: 10,
        order: {
          count: 'DESC',
        },
      });

      const now = new Date();

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(':rainbow_flag: Зал славы :transgender_flag: ')
        .setTimestamp(now)
        .setFooter({
          text: 'CMNW',
          iconURL: 'https://i.imgur.com/OBDcu7K.png',
        });

      for (const gothEntity of gothHallOfGlory) {
        embed.addFields({
          name: `${gothEntity.name}`,
          value: `${gothEntity.count}`,
          inline: true,
        });
      }

      await interaction.reply({
        embeds: [embed],
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
