const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anuncio')
        .setDescription('Crea un embed de anuncio personalizado [Staff]')
        .addStringOption(opt =>
            opt.setName('titulo').setDescription('Título del anuncio').setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('descripcion').setDescription('Descripción del anuncio').setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('color')
                .setDescription('Color del embed')
                .setRequired(false)
                .addChoices(
                    { name: '🔵 Azul', value: '0x5865F2' },
                    { name: '🟡 Dorado', value: '0xFFD700' },
                    { name: '🟢 Verde', value: '0x00C851' },
                    { name: '🔴 Rojo', value: '0xFF0000' },
                    { name: '🟠 Naranja', value: '0xFF6B00' },
                    { name: '⚪ Blanco', value: '0xFFFFFF' }
                )
        )
        .addStringOption(opt =>
            opt.setName('imagen').setDescription('URL de imagen para el embed (opcional)').setRequired(false)
        )
        .addChannelOption(opt =>
            opt.setName('canal').setDescription('Canal donde enviar el anuncio (por defecto el actual)').setRequired(false)
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const titulo = interaction.options.getString('titulo');
        const descripcion = interaction.options.getString('descripcion');
        const colorStr = interaction.options.getString('color') || '0x5865F2';
        const imagenUrl = interaction.options.getString('imagen');
        const canal = interaction.options.getChannel('canal') || interaction.channel;

        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(descripcion)
            .setColor(parseInt(colorStr))
            .setFooter({ text: `Anuncio por ${interaction.user.username}` })
            .setTimestamp();

        if (imagenUrl) embed.setImage(imagenUrl);

        await canal.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ Anuncio enviado en <#${canal.id}>.`, ephemeral: true });
    }
};
