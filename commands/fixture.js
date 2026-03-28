const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fixture')
        .setDescription('Gestiona el fixture de partidos')
        .addSubcommand(sub =>
            sub.setName('agregar')
                .setDescription('Agrega un partido al fixture [Staff]')
                .addRoleOption(opt => opt.setName('equipo1').setDescription('Primer equipo').setRequired(true))
                .addRoleOption(opt => opt.setName('equipo2').setDescription('Segundo equipo').setRequired(true))
                .addStringOption(opt => opt.setName('fecha').setDescription('Fecha del partido (ej: 25/03/2026)').setRequired(true))
                .addStringOption(opt => opt.setName('hora').setDescription('Hora del partido (ej: 21:00)').setRequired(true))
                .addIntegerOption(opt =>
                    opt.setName('division')
                        .setDescription('División')
                        .setRequired(true)
                        .addChoices({ name: 'División 1', value: 1 }, { name: 'División 2', value: 2 })
                )
        )
        .addSubcommand(sub =>
            sub.setName('ver')
                .setDescription('Ver el fixture de partidos')
                .addIntegerOption(opt =>
                    opt.setName('division')
                        .setDescription('Filtrar por división (opcional)')
                        .setRequired(false)
                        .addChoices({ name: 'División 1', value: 1 }, { name: 'División 2', value: 2 })
                )
        )
        .addSubcommand(sub =>
            sub.setName('eliminar')
                .setDescription('Elimina un partido del fixture [Staff]')
                .addIntegerOption(opt => opt.setName('id').setDescription('ID del partido a eliminar').setRequired(true))
        ),

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();
        const data = loadData();
        if (!data.fixture) data.fixture = [];

        if (sub === 'agregar') {
            if (!esStaff(interaction.member, client.config)) {
                return interaction.reply({ content: '❌ Solo el staff puede agregar partidos.', ephemeral: true });
            }

            const rol1 = interaction.options.getRole('equipo1');
            const rol2 = interaction.options.getRole('equipo2');
            const fecha = interaction.options.getString('fecha');
            const hora = interaction.options.getString('hora');
            const division = interaction.options.getInteger('division');

            if (rol1.id === rol2.id) {
                return interaction.reply({ content: '❌ Los dos equipos deben ser diferentes.', ephemeral: true });
            }

            // Convertir fecha y hora a timestamp de Discord
            const [dia, mes, anio] = fecha.split('/');
            const [horas, minutos] = hora.split(':');
            const fechaDate = new Date(anio, mes - 1, dia, horas, minutos);
            const timestamp = Math.floor(fechaDate.getTime() / 1000);

            const id = data.fixture.length > 0 ? Math.max(...data.fixture.map(p => p.id)) + 1 : 1;

            data.fixture.push({
                id,
                equipo1Id: rol1.id,
                equipo2Id: rol2.id,
                timestamp,
                division
            });
            saveData(data);

            // Anunciar en canal de resultados
            const canalResultados = client.config.canalResultados
                ? interaction.guild.channels.cache.get(client.config.canalResultados)
                : null;

            const embed = new EmbedBuilder()
                .setTitle(`🗓️ Partido Programado — División ${division}`)
                .addFields(
                    { name: 'Equipos', value: `<@&${rol1.id}> vs <@&${rol2.id}>`, inline: false },
                    { name: 'Fecha y hora', value: `<t:${timestamp}:F>`, inline: false },
                    { name: 'Faltan', value: `<t:${timestamp}:R>`, inline: false }
                )
                .setColor(division === 1 ? 0xFFD700 : 0xC0C0C0)
                .setTimestamp();

            if (canalResultados) await canalResultados.send({ embeds: [embed] });
            await interaction.reply({ embeds: [embed] });

        } else if (sub === 'ver') {
            const divFiltro = interaction.options.getInteger('division');
            let partidos = [...data.fixture];

            if (divFiltro) partidos = partidos.filter(p => p.division === divFiltro);

            if (partidos.length === 0) {
                return interaction.reply({ content: '📭 No hay partidos programados.', ephemeral: true });
            }

            // Ordenar por fecha
            partidos.sort((a, b) => a.timestamp - b.timestamp);

            const desc = partidos.map(p =>
                `**#${p.id}** <@&${p.equipo1Id}> vs <@&${p.equipo2Id}>\n📅 <t:${p.timestamp}:F> — <t:${p.timestamp}:R>`
            ).join('\n\n');

            const embed = new EmbedBuilder()
                .setTitle(divFiltro ? `🗓️ Fixture — División ${divFiltro}` : '🗓️ Fixture Completo')
                .setDescription(desc)
                .setColor(0x5865F2)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (sub === 'eliminar') {
            if (!esStaff(interaction.member, client.config)) {
                return interaction.reply({ content: '❌ Solo el staff puede eliminar partidos.', ephemeral: true });
            }

            const id = interaction.options.getInteger('id');
            const index = data.fixture.findIndex(p => p.id === id);

            if (index === -1) {
                return interaction.reply({ content: `❌ No existe un partido con ID **#${id}**.`, ephemeral: true });
            }

            data.fixture.splice(index, 1);
            saveData(data);
            await interaction.reply({ content: `✅ Partido **#${id}** eliminado del fixture.` });
        }
    }
};
