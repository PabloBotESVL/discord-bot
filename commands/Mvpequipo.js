const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mvpequipo')
        .setDescription('Gestiona el MVP de equipo')
        .addSubcommand(sub =>
            sub.setName('dar')
                .setDescription('Designa el equipo MVP de una fecha [Staff]')
                .addRoleOption(opt => opt.setName('equipo').setDescription('Equipo MVP').setRequired(true))
                .addStringOption(opt => opt.setName('fecha').setDescription('Número o nombre de la fecha (ej: Fecha 3)').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Motivo o descripción').setRequired(true))
                .addIntegerOption(opt =>
                    opt.setName('division')
                        .setDescription('División')
                        .setRequired(true)
                        .addChoices({ name: 'División 1', value: 1 }, { name: 'División 2', value: 2 })
                )
        )
        .addSubcommand(sub =>
            sub.setName('historial')
                .setDescription('Ver el historial de equipos MVP')
                .addIntegerOption(opt =>
                    opt.setName('division')
                        .setDescription('Filtrar por división (opcional)')
                        .setRequired(false)
                        .addChoices({ name: 'División 1', value: 1 }, { name: 'División 2', value: 2 })
                )
        ),

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();
        const data = loadData();
        if (!data.mvpsEquipos) data.mvpsEquipos = [];

        const canalAnuncios = client.config.canalAnuncios
            ? interaction.guild.channels.cache.get(client.config.canalAnuncios)
            : null;

        if (sub === 'dar') {
            if (!esStaff(interaction.member, client.config)) {
                return interaction.reply({ content: '❌ Solo el staff puede asignar el MVP de equipo.', ephemeral: true });
            }

            const rol = interaction.options.getRole('equipo');
            const fecha = interaction.options.getString('fecha');
            const motivo = interaction.options.getString('motivo');
            const division = interaction.options.getInteger('division');

            if (!data.equipos[rol.id]) {
                return interaction.reply({ content: `❌ <@&${rol.id}> no está registrado.`, ephemeral: true });
            }

            const iconoEquipo = data.equipos[rol.id].imagen || null;

            data.mvpsEquipos.push({
                equipoId: rol.id,
                fecha,
                division,
                motivo,
                timestamp: Math.floor(Date.now() / 1000)
            });
            saveData(data);

            const embed = new EmbedBuilder()
                .setTitle(`🏆 Equipo MVP — ${fecha}`)
                .setDescription(`¡El equipo MVP de la **${fecha}** es <@&${rol.id}>!`)
                .addFields(
                    { name: 'Equipo', value: `<@&${rol.id}>`, inline: true },
                    { name: 'División', value: `División ${division}`, inline: true },
                    { name: '📝 Motivo', value: motivo, inline: false }
                )
                .setColor(0xFFD700)
                .setTimestamp();

            if (iconoEquipo) embed.setThumbnail(iconoEquipo);

            if (canalAnuncios) await canalAnuncios.send({ embeds: [embed] });
            await interaction.reply({ embeds: [embed] });

        } else if (sub === 'historial') {
            const divFiltro = interaction.options.getInteger('division');
            let lista = [...data.mvpsEquipos];

            if (divFiltro) lista = lista.filter(m => m.division === divFiltro);

            if (lista.length === 0) {
                return interaction.reply({ content: '📭 No hay equipos MVP registrados todavía.', ephemeral: true });
            }

            const desc = lista.slice(-10).reverse().map((m, i) =>
                `**${i + 1}.** <@&${m.equipoId}> — ${m.fecha} (Div. ${m.division})\n📝 ${m.motivo}`
            ).join('\n\n');

            const embed = new EmbedBuilder()
                .setTitle(divFiltro ? `🏆 Historial MVP Equipo — División ${divFiltro}` : '🏆 Historial MVP Equipo')
                .setDescription(desc)
                .setColor(0xFFD700)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};
