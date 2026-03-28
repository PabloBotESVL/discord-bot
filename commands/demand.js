const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadData } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demand')
        .setDescription('Solicitá tu propia baja de tu equipo actual'),

    async execute(interaction, client) {
        const data = loadData();

        let equipoRolId = null;
        for (const rolId in data.equipos) {
            const eq = data.equipos[rolId];
            if (eq.jugadores && eq.jugadores.includes(interaction.user.id)) {
                equipoRolId = rolId;
                break;
            }
        }

        if (!equipoRolId) {
            return interaction.reply({
                content: '❌ No estás en ningún equipo actualmente.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Confirmar Baja')
            .setDescription(`¿Estás seguro que querés darte de baja de <@&${equipoRolId}>?\n\nEsta acción no se puede deshacer.`)
            .setColor(0xFF6B00);

        const botones = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`baja_confirmar_${equipoRolId}_${interaction.user.id}`)
                .setLabel('Sí, darme de baja')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`baja_cancelar_${interaction.user.id}`)
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [botones], ephemeral: true });
    }
};