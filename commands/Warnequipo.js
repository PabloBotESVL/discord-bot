const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnequipo')
        .setDescription('Gestiona advertencias de un equipo [Staff]')
        .addSubcommand(sub =>
            sub.setName('dar')
                .setDescription('Da una advertencia a un equipo entero')
                .addRoleOption(opt => opt.setName('equipo').setDescription('Equipo').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Motivo').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('ver')
                .setDescription('Ver advertencias de un equipo')
                .addRoleOption(opt => opt.setName('equipo').setDescription('Equipo').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('quitar')
                .setDescription('Quita una advertencia a un equipo')
                .addRoleOption(opt => opt.setName('equipo').setDescription('Equipo').setRequired(true))
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const rol = interaction.options.getRole('equipo');
        const data = loadData();

        if (!data.equipos[rol.id]) {
            return interaction.reply({ content: `❌ <@&${rol.id}> no está registrado.`, ephemeral: true });
        }

        if (!data.warnsEquipos) data.warnsEquipos = {};
        if (!data.warnsEquipos[rol.id]) data.warnsEquipos[rol.id] = [];

        const canalAnuncios = client.config.canalAnuncios
            ? interaction.guild.channels.cache.get(client.config.canalAnuncios)
            : null;

        if (sub === 'dar') {
            const motivo = interaction.options.getString('motivo');
            data.warnsEquipos[rol.id].push({ motivo, fecha: new Date().toISOString() });
            const total = data.warnsEquipos[rol.id].length;
            const iconoEquipo = data.equipos[rol.id].imagen || null;

            // Si llegó a 3 warns — sancionar
            if (total >= 3) {
                data.warnsEquipos[rol.id] = []; // resetear
                saveData(data);

                // Quitar rol del equipo a todos los miembros
                await interaction.guild.members.fetch();
                const miembros = interaction.guild.members.cache.filter(m =>
                    m.roles.cache.has(rol.id) && !m.user.bot
                );

                for (const [, member] of miembros) {
                    await member.roles.remove(rol.id).catch(() => {});
                }

                const embedSancion = new EmbedBuilder()
                    .setTitle('🚨 Equipo Sancionado')
                    .setDescription(`<@&${rol.id}> ha acumulado **3 advertencias** y ha sido sancionado.`)
                    .addFields(
                        { name: 'Equipo', value: `<@&${rol.id}>`, inline: false },
                        { name: 'Última advertencia', value: motivo, inline: false },
                        { name: 'Acción', value: 'Se removió el rol del equipo a todos los jugadores y al DT.', inline: false },
                        { name: 'Warns', value: 'Reseteadas a 0', inline: false }
                    )
                    .setColor(0xFF0000)
                    .setTimestamp();

                if (iconoEquipo) embedSancion.setThumbnail(iconoEquipo);
                if (canalAnuncios) await canalAnuncios.send({ embeds: [embedSancion] });
                return interaction.reply({ embeds: [embedSancion] });
            }

            saveData(data);

            const colores = [0xFFA500, 0xFF6B00, 0xFF0000];
            const embed = new EmbedBuilder()
                .setTitle(`⚠️ Advertencia al Equipo (${total}/3)`)
                .setDescription(`<@&${rol.id}> ha recibido una advertencia.`)
                .addFields(
                    { name: 'Equipo', value: `<@&${rol.id}>`, inline: false },
                    { name: 'Motivo', value: motivo, inline: false },
                    { name: 'Advertencias', value: `${total}/3`, inline: false }
                )
                .setColor(colores[total - 1])
                .setTimestamp();

            if (iconoEquipo) embed.setThumbnail(iconoEquipo);
            if (canalAnuncios) await canalAnuncios.send({ embeds: [embed] });
            await interaction.reply({ embeds: [embed] });

        } else if (sub === 'ver') {
            const lista = data.warnsEquipos[rol.id];
            if (!lista || lista.length === 0) {
                return interaction.reply({ content: `✅ <@&${rol.id}> no tiene advertencias.`, ephemeral: true });
            }

            const desc = lista.map((w, i) =>
                `**${i + 1}.** ${w.motivo} — <t:${Math.floor(new Date(w.fecha).getTime() / 1000)}:d>`
            ).join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`⚠️ Advertencias de ${rol.name} (${lista.length}/3)`)
                .setDescription(desc)
                .setColor(0xFFA500);

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (sub === 'quitar') {
            if (!data.warnsEquipos[rol.id].length) {
                return interaction.reply({ content: `⚠️ <@&${rol.id}> no tiene advertencias.`, ephemeral: true });
            }
            data.warnsEquipos[rol.id].pop();
            saveData(data);
            await interaction.reply({ content: `✅ Última advertencia de <@&${rol.id}> eliminada.` });
        }
    }
};