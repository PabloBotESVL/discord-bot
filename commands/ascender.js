const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff, getDivisionDeEquipo } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ascender')
        .setDescription('Asciende un equipo de División 2 a División 1 [Staff]')
        .addRoleOption(opt =>
            opt.setName('equipo').setDescription('Equipo a ascender').setRequired(true)
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const rol = interaction.options.getRole('equipo');
        const data = loadData();
        const division = getDivisionDeEquipo(rol.id, data);

        if (division !== 2) {
            return interaction.reply({ content: `❌ **${rol.name}** no está en División 2.`, ephemeral: true });
        }

        if (data.division1.length >= 6) {
            return interaction.reply({ content: '❌ División 1 ya tiene 6 equipos. Primero descendé uno.', ephemeral: true });
        }

        data.division2 = data.division2.filter(id => id !== rol.id);
        data.division1.push(rol.id);
        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle('⬆️ Ascenso')
            .setDescription(`**${rol.name}** ha ascendido a la **División 1**! 🎉`)
            .setColor(0xFFD700)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};