const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, getDivisionDeEquipo } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Muestra el perfil de un jugador')
        .addUserOption(opt =>
            opt.setName('jugador')
                .setDescription('Jugador a consultar (dejá vacío para ver el tuyo)')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const target = interaction.options.getUser('jugador') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        const data = loadData();

        // ── Verificar si está baneado ──
        const baneado = data.bans?.find(b => b.id === target.id);

        // ── Buscar en qué equipo está ──
        let equipoRolId = null;
        let cargo = null;

        for (const [rolId, eq] of Object.entries(data.equipos)) {
            if (eq.dt === target.id) { equipoRolId = rolId; cargo = 'DT'; break; }
            if (eq.subdt === target.id) { equipoRolId = rolId; cargo = 'Sub-DT'; break; }
            if (eq.jugadores?.includes(target.id)) { equipoRolId = rolId; cargo = 'Jugador'; break; }
        }

        // ── División ──
        const division = equipoRolId ? getDivisionDeEquipo(equipoRolId, data) : null;
        const equipoRol = equipoRolId ? interaction.guild.roles.cache.get(equipoRolId) : null;

        // ── Advertencias ──
        const advertencias = data.advertencias?.[target.id] || [];

        // ── Color del embed según estado ──
        let color = 0x5865F2;
        if (baneado) color = 0xFF0000;
        else if (advertencias.length >= 3) color = 0xFFA500;
        else if (equipoRolId && equipoRol) color = equipoRol.color || 0x5865F2;

        // ── Construir embed ──
        const embed = new EmbedBuilder()
            .setAuthor({
                name: target.username,
                iconURL: target.displayAvatarURL({ dynamic: true })
            })
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor(color)
            .setTimestamp();

        if (baneado) {
            embed.setTitle('🔨 Jugador Baneado');
            embed.setDescription(`**Motivo:** ${baneado.motivo}`);
        } else {
            embed.setTitle(`📋 Perfil de ${target.username}`);
        }

        if (equipoRol && division) {
            embed.addFields({
                name: '🏐 Equipo',
                value: `${equipoRol.name} — División ${division}`,
                inline: true
            });
        } else if (!baneado) {
            embed.addFields({
                name: '🏐 Equipo',
                value: 'Sin equipo',
                inline: true
            });
        }

        if (cargo) {
            const cargoEmoji = cargo === 'DT' ? '🎽' : cargo === 'Sub-DT' ? '🥈' : '👤';
            embed.addFields({
                name: 'Cargo',
                value: `${cargoEmoji} ${cargo}`,
                inline: true
            });
        }

        const advEmoji = advertencias.length === 0 ? '✅' : advertencias.length === 1 ? '⚠️' : '🚨';
        embed.addFields({
            name: 'Advertencias',
            value: `${advEmoji} ${advertencias.length}`,
            inline: true
        });

        if (advertencias.length > 0) {
            const detalle = advertencias.map((a, i) =>
                `**${i + 1}.** ${a.motivo}`
            ).join('\n');
            embed.addFields({
                name: '📝 Detalle',
                value: detalle,
                inline: false
            });
        }

        const esPropio = target.id === interaction.user.id;
        await interaction.reply({
            embeds: [embed],
            ephemeral: esPropio
        });
    }
};