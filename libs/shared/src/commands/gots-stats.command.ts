import { SlashCommandBuilder } from '@discordjs/builders';
import { ISlashCommand, ISlashCommandArgs } from '@app/shared/interface';
import { EmbedBuilder } from 'discord.js';
import { FEFENYA_COMMANDS } from '@app/shared/enums';

export const GotsStatsCommand: ISlashCommand = {
  name: FEFENYA_COMMANDS.GOTS_STATS,
  description: 'Show heroes of glory hall',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName(FEFENYA_COMMANDS.GOTS_STATS)
    .setDescription('Show heroes of glory hall'),

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

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Зал славы')
        .setDescription(':rainbow_flag:')
        .setTimestamp(new Date())
        .setFooter({
          text: 'Managed & operated by CMNW',
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
