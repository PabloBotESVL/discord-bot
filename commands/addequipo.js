const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addequipo')
        .setDescription('Agrega un equipo a una división [Staff]')
        .addRoleOption(opt =>
            opt.setName('equipo')
                .setDescription('Rol del equipo')
                .setRequired(true)
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
                .setDescription('Emoji del server que representa al equipo (ej: <:johzenji:123456789>)')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const rol = interaction.options.getRole('equipo');
        const division = interaction.options.getInteger('division');
        const emojiInput = interaction.options.getString('emoji');
        const data = loadData();

        if (!data.division1) data.division1 = [];
        if (!data.division2) data.division2 = [];

        if (data.division1.includes(rol.id) || data.division2.includes(rol.id)) {
            return interaction.reply({ content: `⚠️ **${rol.name}** ya está en una división.`, ephemeral: true });
        }

        const maxEquipos = division === 1 ? 6 : 7;
        const divArray = division === 1 ? data.division1 : data.division2;

        if (divArray.length >= maxEquipos) {
            return interaction.reply({ content: `❌ La División ${division} ya tiene el máximo de equipos (${maxEquipos}).`, ephemeral: true });
        }

        // Extraer URL del emoji del servidor
        let imagenUrl = null;
        if (emojiInput) {
            // Formato emoji animado: <a:nombre:ID> — formato estático: <:nombre:ID>
            const match = emojiInput.match(/<a?:\w+:(\d+)>/);
            if (match) {
                const emojiId = match[1];
                const isAnimated = emojiInput.startsWith('<a:');
                const ext = isAnimated ? 'gif' : 'png';
                imagenUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?size=128`;
            } else {
                return interaction.reply({ content: '⚠️ El emoji debe ser un emoji del servidor, no un emoji estándar. Ejemplo: `<:johzenji:123456789>`', ephemeral: true });
            }
        }

        divArray.push(rol.id);
        data.equipos[rol.id] = {
            puntos: 0,
            victorias: 0,
            derrotas: 0,
            jugadores: [],
            dt: null,
            subdt: null,
            imagen: imagenUrl
        };
        saveData(data);

        const preview = imagenUrl ? `\n🖼️ Imagen: ${imagenUrl}` : '\n⚠️ Sin imagen asignada (podés usar `/editarimagen` después).';
        await interaction.reply({ content: `✅ **${rol.name}** agregado a la División ${division}.${preview}` });
    }
};