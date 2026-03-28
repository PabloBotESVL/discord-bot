const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff, getDivisionDeEquipo } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resultado')
        .setDescription('Registra el resultado de un partido [Staff]')
        .addRoleOption(opt =>
            opt.setName('equipo1').setDescription('Primer equipo').setRequired(true)
        )
        .addRoleOption(opt =>
            opt.setName('equipo2').setDescription('Segundo equipo').setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('sets1').setDescription('Sets ganados por equipo 1 (0, 1 o 2)').setRequired(true)
                .addChoices({ name: '0', value: 0 }, { name: '1', value: 1 }, { name: '2', value: 2 })
        )
        .addIntegerOption(opt =>
            opt.setName('sets2').setDescription('Sets ganados por equipo 2 (0, 1 o 2)').setRequired(true)
                .addChoices({ name: '0', value: 0 }, { name: '1', value: 1 }, { name: '2', value: 2 })
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const rol1 = interaction.options.getRole('equipo1');
        const rol2 = interaction.options.getRole('equipo2');
        const sets1 = interaction.options.getInteger('sets1');
        const sets2 = interaction.options.getInteger('sets2');

        // Validar resultado válido (2-0, 2-1, 0-2, 1-2)
        const validos = [[2,0],[0,2],[2,1],[1,2]];
        const esValido = validos.some(([a,b]) => a === sets1 && b === sets2);

        if (!esValido) {
            return interaction.reply({ content: '❌ Resultado inválido. Los sets válidos son: 2-0, 0-2, 2-1, 1-2.', ephemeral: true });
        }

        const data = loadData();

        if (!data.equipos[rol1.id] || !data.equipos[rol2.id]) {
            return interaction.reply({ content: '❌ Uno o ambos equipos no están registrados en ninguna división.', ephemeral: true });
        }

        const ganador = sets1 > sets2 ? rol1 : rol2;
        const perdedor = sets1 > sets2 ? rol2 : rol1;

        data.equipos[ganador.id].puntos = (data.equipos[ganador.id].puntos || 0) + 3;
        data.equipos[ganador.id].victorias = (data.equipos[ganador.id].victorias || 0) + 1;
        data.equipos[perdedor.id].derrotas = (data.equipos[perdedor.id].derrotas || 0) + 1;

        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle('🏐 Resultado Registrado')
            .setDescription(
                `**${rol1.name}** ${sets1} — ${sets2} **${rol2.name}**\n\n` +
                `🏆 Ganador: ${ganador.name} (+3 pts)\n` +
                `📉 Perdedor: ${perdedor.name} (+0 pts)`
            )
            .setColor(0x00C851)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};