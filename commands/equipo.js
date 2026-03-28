const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, getDivisionDeEquipo } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('equipo')
        .setDescription('Muestra la información de un equipo')
        .addRoleOption(opt =>
            opt.setName('equipo').setDescription('Equipo a consultar').setRequired(true)
        ),

    async execute(interaction, client) {
        const rol = interaction.options.getRole('equipo');
        const data = loadData();

        if (!data.equipos[rol.id]) {
            return interaction.reply({ content: `❌ **${rol.name}** no está registrado en la liga.`, ephemeral: true });
        }

        const eq = data.equipos[rol.id];
        const division = getDivisionDeEquipo(rol.id, data);
        const pj = (eq.victorias || 0) + (eq.derrotas || 0);

        const fetchUser = async (id) => {
            if (!id) return 'Vacante';
            const u = await client.users.fetch(id).catch(() => null);
            return u ? u.username : 'Desconocido';
        };

        const dtNombre = await fetchUser(eq.dt);
        const subdtNombre = await fetchUser(eq.subdt);

        const jugadoresTexto = eq.jugadores && eq.jugadores.length > 0
            ? (await Promise.all(eq.jugadores.map(id => fetchUser(id)))).join(', ')
            : 'Sin jugadores';

        const embed = new EmbedBuilder()
            .setTitle(`🏐 ${rol.name}`)
            .setColor(rol.color || 0x5865F2)
            .addFields(
                { name: '📊 División', value: division ? `División ${division}` : 'Sin división', inline: true },
                { name: '🏆 Puntos', value: String(eq.puntos || 0), inline: true },
                { name: '📈 PJ/V/D', value: `${pj} / ${eq.victorias || 0} / ${eq.derrotas || 0}`, inline: true },
                { name: '🎽 DT', value: dtNombre, inline: true },
                { name: '🎽 Sub-DT', value: subdtNombre, inline: true },
                { name: `👥 Plantel (${eq.jugadores?.length || 0}/12)`, value: jugadoresTexto }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};