const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Desbanea un jugador de la liga [Staff]')
        .addUserOption(opt => opt.setName('jugador').setDescription('Jugador a desbanear').setRequired(true)),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const jugador = interaction.options.getUser('jugador');
        const data = loadData();
        if (!data.bans) data.bans = [];

        const index = data.bans.findIndex(b => b.id === jugador.id);
        if (index === -1) {
            return interaction.reply({ content: `⚠️ <@${jugador.id}> no está baneado.`, ephemeral: true });
        }

        data.bans.splice(index, 1);
        saveData(data);
        await interaction.reply({ content: `✅ <@${jugador.id}> desbaneado de la liga.` });
    }
};
