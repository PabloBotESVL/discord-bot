const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resettemporada')
        .setDescription('Resetea todos los puntos y stats de la temporada actual [Staff]')
        .addStringOption(opt =>
            opt.setName('temporada')
                .setDescription('Nombre de la nueva temporada (ej: Temporada 2)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const nuevaTemporada = interaction.options.getString('temporada');

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Confirmar Reset de Temporada')
            .setDescription(
                `Estás por resetear **toda** la temporada actual.\n\n` +
                `**Se va a limpiar:**\n` +
                `• Puntos de todos los equipos\n` +
                `• Victorias y derrotas\n` +
                `• Historial de partidos\n` +
                `• Fixture actual\n\n` +
                `**Nueva temporada:** ${nuevaTemporada}\n\n` +
                `⚠️ **Esta acción no se puede deshacer.**`
            )
            .setColor(0xFF0000);

        const botones = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`reset_confirmar_${interaction.user.id}_${encodeURIComponent(nuevaTemporada)}`)
                .setLabel('Sí, resetear temporada')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`reset_cancelar_${interaction.user.id}`)
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [botones], ephemeral: true });
    }
};
