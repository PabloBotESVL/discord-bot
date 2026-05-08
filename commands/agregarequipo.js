const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('agregarequipo')
        .setDescription('Registra un equipo y escanea automáticamente sus jugadores y DTs [Staff]')
        .addRoleOption(opt =>
            opt.setName('equipo').setDescription('Rol del equipo').setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('division')
                .setDescription('División (1 o 2)')
                .setRequired(true)
                .addChoices(
                    { name: 'División 1', value: 1 },
                    { name: 'División 2', value: 2 }
                )
        )
        .addStringOption(opt =>
            opt.setName('emoji')
                .setDescription('Emoji del server (ej: <:nombre:123456789>)')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        await interaction.deferReply();

        const rol = interaction.options.getRole('equipo');
        const division = interaction.options.getInteger('division');
        const emojiInput = interaction.options.getString('emoji');
        const data = loadData();

        if (!data.division1) data.division1 = [];
        if (!data.division2) data.division2 = [];

        if (data.division1.includes(rol.id) || data.division2.includes(rol.id)) {
            return interaction.editReply({ content: `⚠️ <@&${rol.id}> ya está registrado en una división.` });
        }

        // Extraer imagen del emoji
        let imagenUrl = null;
        if (emojiInput) {
            const match = emojiInput.match(/<a?:\w+:(\d+)>/);
            if (match) {
                const emojiId = match[1];
                const ext = emojiInput.startsWith('<a:') ? 'gif' : 'png';
                imagenUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?size=128`;
            }
        }

        // Obtener roles de DT y Sub-DT del data.config
        const dtRolId = data.config?.dt || client.config?.roles?.dt;

        // Escanear miembros con el rol del equipo
        await interaction.guild.members.fetch();
        const miembros = interaction.guild.members.cache.filter(m =>
            m.roles.cache.has(rol.id) && !m.user.bot
        );

        const jugadores = [];
        let dt = null;
        const subdts = [];

        for (const [, member] of miembros) {
            // Detectar DT y Sub-DT
            if (dtRolId && member.roles.cache.has(dtRolId)) {
                if (!dt) {
                    dt = member.id;
                } else {
                    subdts.push(member.id);
                }
            } else {
                jugadores.push(member.id);
            }
        }

        const divArray = division === 1 ? data.division1 : data.division2;
        divArray.push(rol.id);

        data.equipos[rol.id] = {
            nombre: rol.name,
            puntos: 0,
            victorias: 0,
            derrotas: 0,
            jugadores,
            dt: dt || null,
            subdt: subdts[0] || null,
            subdt2: subdts[1] || null,
            imagen: imagenUrl
        };

        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle(`✅ Equipo Registrado — ${rol.name}`)
            .addFields(
                { name: '📊 División', value: `División ${division}`, inline: true },
                { name: '👥 Jugadores detectados', value: `${jugadores.length}`, inline: true },
                { name: '🎽 DT', value: dt ? `<@${dt}>` : 'No detectado', inline: true },
                { name: '🥈 Sub-DT 1', value: subdts[0] ? `<@${subdts[0]}>` : 'No detectado', inline: true },
                { name: '🥈 Sub-DT 2', value: subdts[1] ? `<@${subdts[1]}>` : 'No detectado', inline: true }
            )
            .setColor(rol.color || 0x5865F2)
            .setTimestamp();

        if (imagenUrl) embed.setThumbnail(imagenUrl);

        await interaction.editReply({ embeds: [embed] });
    }
};
