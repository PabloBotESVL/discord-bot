const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editarimagen')
        .setDescription('Cambia la imagen de un equipo [Staff]')
        .addRoleOption(opt =>
            opt.setName('equipo')
                .setDescription('Rol del equipo')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('emoji')
                .setDescription('Nuevo emoji del server (ej: <:johzenji:123456789>)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const rol = interaction.options.getRole('equipo');
        const emojiInput = interaction.options.getString('emoji');
        const data = loadData();

        if (!data.equipos[rol.id]) {
            return interaction.reply({ content: `❌ <@&${rol.id}> no está registrado. Usá /addequipo primero.`, ephemeral: true });
        }

        const match = emojiInput.match(/<a?:\w+:(\d+)>/);
        if (!match) {
            return interaction.reply({ content: '⚠️ El emoji debe ser un emoji del servidor. Ejemplo: `<:johzenji:123456789>`', ephemeral: true });
        }

        const emojiId = match[1];
        const isAnimated = emojiInput.startsWith('<a:');
        const ext = isAnimated ? 'gif' : 'png';
        const imagenUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?size=128`;

        data.equipos[rol.id].imagen = imagenUrl;
        saveData(data);

        await interaction.reply({ content: `✅ Imagen de <@&${rol.id}> actualizada.\n🖼️ ${imagenUrl}` });
    }
};