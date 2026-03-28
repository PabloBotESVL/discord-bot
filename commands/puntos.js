const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('puntos')
        .setDescription('Edita los puntos de un equipo manualmente [Staff]')
        .addRoleOption(opt =>
            opt.setName('equipo').setDescription('Equipo').setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('cantidad').setDescription('Puntos a sumar (negativo para restar)').setRequired(true)
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const rol = interaction.options.getRole('equipo');
        const cantidad = interaction.options.getInteger('cantidad');
        const data = loadData();

        if (!data.equipos[rol.id]) {
            return interaction.reply({ content: `❌ **${rol.name}** no está registrado.`, ephemeral: true });
        }

        data.equipos[rol.id].puntos = Math.max(0, (data.equipos[rol.id].puntos || 0) + cantidad);
        saveData(data);

        const signo = cantidad >= 0 ? `+${cantidad}` : `${cantidad}`;
        await interaction.reply({
            content: `✅ **${rol.name}**: ${signo} pts → Total: **${data.equipos[rol.id].puntos} pts**`
        });
    }
};