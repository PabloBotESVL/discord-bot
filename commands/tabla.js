const { SlashCommandBuilder } = require('discord.js');
const { buildTablaEmbed, loadData } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tabla')
        .setDescription('Muestra la tabla de posiciones')
        .addIntegerOption(opt =>
            opt.setName('division')
                .setDescription('Número de división (1 o 2)')
                .setRequired(true)
                .addChoices(
                    { name: 'División 1', value: 1 },
                    { name: 'División 2', value: 2 }
                )
        ),

    async execute(interaction, client) {
        const division = interaction.options.getInteger('division');
        const data = loadData();
        const embed = buildTablaEmbed(division, data, interaction.guild);
        await interaction.reply({ embeds: [embed] });
    }
};