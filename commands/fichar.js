const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadData, esStaff } = require('../helpers');

const MAX_JUGADORES = 20;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fichar')
        .setDescription('Propone fichar un jugador a un equipo [Staff/DT]')
        .addUserOption(opt =>
            opt.setName('jugador').setDescription('Usuario a fichar').setRequired(true)
        )
        .addRoleOption(opt =>
            opt.setName('equipo').setDescription('Equipo destino').setRequired(true)
        ),

    async execute(interaction, client) {
        const data = loadData();
        const dtRolId = data.config?.dt || client.config?.roles?.dt;
        const esDT = dtRolId ? interaction.member.roles.cache.has(dtRolId) : false;

        if (!esStaff(interaction.member, client.config) && !esDT) {
            return interaction.reply({ content: '❌ Solo el staff o los DTs pueden fichar jugadores.', ephemeral: true });
        }

        const jugador = interaction.options.getUser('jugador');
        const rol = interaction.options.getRole('equipo');

        if (!data.equipos[rol.id]) {
            return interaction.reply({ content: `❌ El equipo <@&${rol.id}> no está registrado.`, ephemeral: true });
        }

        const equipo = data.equipos[rol.id];
        if (!equipo.jugadores) equipo.jugadores = [];

        if (equipo.jugadores.includes(jugador.id)) {
            return interaction.reply({ content: `⚠️ <@${jugador.id}> ya está en <@&${rol.id}>.`, ephemeral: true });
        }

        if (equipo.jugadores.length >= MAX_JUGADORES) {
            return interaction.reply({ content: `❌ <@&${rol.id}> ya tiene el máximo de ${MAX_JUGADORES} jugadores.`, ephemeral: true });
        }

        const iconoEquipo = equipo.imagen || null;

        const embed = new EmbedBuilder()
            .setTitle('📥 Propuesta de Fichaje')
            .setDescription(`<@&${rol.id}> ha enviado una propuesta de fichaje a <@${jugador.id}>`)
            .addFields(
                { name: 'Jugador', value: `<@${jugador.id}>`, inline: false },
                { name: 'Equipo', value: `<@&${rol.id}>`, inline: false },
                { name: 'Estado', value: '⏳ Pendiente de respuesta', inline: false }
            )
            .setColor(0x5865F2)
            .setTimestamp();

        if (iconoEquipo) embed.setThumbnail(iconoEquipo);

        const botones = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`fichar_aceptar_${jugador.id}_${rol.id}_${interaction.user.id}`)
                .setLabel('Aceptar')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`fichar_rechazar_${jugador.id}_${rol.id}_${interaction.user.id}`)
                .setLabel('Rechazar')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ content: `<@${jugador.id}>`, embeds: [embed], components: [botones] });
    }
};
