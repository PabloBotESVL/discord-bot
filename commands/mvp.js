const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mvp')
        .setDescription('Gestiona el MVP de la fecha')
        .addSubcommand(sub =>
            sub.setName('dar')
                .setDescription('Designa el MVP de una fecha [Staff]')
                .addUserOption(opt => opt.setName('jugador').setDescription('Jugador MVP').setRequired(true))
                .addStringOption(opt => opt.setName('fecha').setDescription('Número de fecha (ej: 3)').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Motivo').setRequired(true))
                .addIntegerOption(opt =>
                    opt.setName('division')
                        .setDescription('División')
                        .setRequired(true)
                        .addChoices({ name: 'División 1', value: 1 }, { name: 'División 2', value: 2 })
                )
        )
        .addSubcommand(sub =>
            sub.setName('historial')
                .setDescription('Ver el historial de MVPs')
        ),

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();
        const data = loadData();
        if (!data.mvps) data.mvps = [];

        if (sub === 'dar') {
            if (!esStaff(interaction.member, client.config)) {
                return interaction.reply({ content: '❌ Solo el staff puede asignar el MVP.', ephemeral: true });
            }

            const jugador = interaction.options.getUser('jugador');
            const fecha = interaction.options.getString('fecha');
            const motivo = interaction.options.getString('motivo');
            const division = interaction.options.getInteger('division');

            let equipoId = null;
            for (const [rolId, eq] of Object.entries(data.equipos)) {
                if (eq.jugadores?.includes(jugador.id) || eq.dt === jugador.id || eq.subdt === jugador.id || eq.subdt2 === jugador.id) {
                    equipoId = rolId;
                    break;
                }
            }

            const iconoEquipo = equipoId ? data.equipos[equipoId]?.imagen : null;

            data.mvps.push({
                jugadorId: jugador.id,
                equipoId,
                fecha,
                division,
                motivo,
                timestamp: Math.floor(Date.now() / 1000)
            });
            saveData(data);

            const embed = new EmbedBuilder()
                .setTitle(`⭐ MVP — Fecha ${fecha}`)
                .setDescription(`¡El MVP de la **Fecha ${fecha}** es <@${jugador.id}>!`)
                .addFields(
                    { name: 'Jugador', value: `<@${jugador.id}>`, inline: true },
                    { name: 'Equipo', value: equipoId ? `<@&${equipoId}>` : 'Sin equipo', inline: true },
                    { name: 'División', value: `División ${division}`, inline: true },
                    { name: '📝 Motivo', value: motivo, inline: false }
                )
                .setThumbnail(jugador.displayAvatarURL({ dynamic: true }))
                .setColor(0xFFD700)
                .setTimestamp();

            if (iconoEquipo) embed.setImage(iconoEquipo);

            const canalResultados = client.config.canalResultados
                ? interaction.guild.channels.cache.get(client.config.canalResultados)
                : null;
            if (canalResultados) await canalResultados.send({ embeds: [embed] });

            await interaction.reply({ embeds: [embed] });

        } else if (sub === 'historial') {
            if (data.mvps.length === 0) {
                return interaction.reply({ content: '📭 No hay MVPs registrados todavía.', ephemeral: true });
            }

            const desc = data.mvps.slice(-10).reverse().map((m, i) =>
                `**${i + 1}.** <@${m.jugadorId}> — Fecha ${m.fecha} (Div. ${m.division})\n📝 ${m.motivo}`
            ).join('\n\n');

            const embed = new EmbedBuilder()
                .setTitle('⭐ Historial de MVPs')
                .setDescription(desc)
                .setColor(0xFFD700)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};
