const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('historial')
        .setDescription('Muestra el historial de partidos')
        .addRoleOption(opt =>
            opt.setName('equipo')
                .setDescription('Filtrar por equipo (opcional)')
                .setRequired(false)
        )
        .addIntegerOption(opt =>
            opt.setName('division')
                .setDescription('Filtrar por división (opcional)')
                .setRequired(false)
                .addChoices(
                    { name: 'División 1', value: 1 },
                    { name: 'División 2', value: 2 }
                )
        ),

    async execute(interaction, client) {
        const data = loadData();
        const rolFiltro = interaction.options.getRole('equipo');
        const divFiltro = interaction.options.getInteger('division');

        if (!data.historial || data.historial.length === 0) {
            return interaction.reply({ content: '📭 No hay partidos registrados todavía.', ephemeral: true });
        }

        let partidos = [...data.historial];

        if (rolFiltro) {
            partidos = partidos.filter(p => p.equipo1Id === rolFiltro.id || p.equipo2Id === rolFiltro.id);
        }

        if (divFiltro) {
            const equiposDiv = divFiltro === 1 ? data.division1 : data.division2;
            partidos = partidos.filter(p => equiposDiv.includes(p.equipo1Id) || equiposDiv.includes(p.equipo2Id));
        }

        if (partidos.length === 0) {
            return interaction.reply({ content: '📭 No hay partidos con ese filtro.', ephemeral: true });
        }

        // Mostrar últimos 10
        const ultimos = partidos.slice(-10).reverse();

        const desc = ultimos.map((p, i) => {
            const ganadorMention = `<@&${p.ganadorId}>`;
            return `**${i + 1}.** <@&${p.equipo1Id}> **${p.sets1}** — **${p.sets2}** <@&${p.equipo2Id}>\n🏆 ${ganadorMention} — <t:${p.timestamp}:d>`;
        }).join('\n\n');

        const titulo = rolFiltro
            ? `📋 Historial de ${rolFiltro.name}`
            : divFiltro
                ? `📋 Historial — División ${divFiltro}`
                : '📋 Historial de Partidos';

        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(desc)
            .setColor(0x5865F2)
            .setFooter({ text: `Mostrando últimos ${ultimos.length} partidos` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
