const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('agentes')
        .setDescription('Muestra todos los jugadores agentes libres'),

    async execute(interaction, client) {
        await interaction.deferReply();

        const config = client.config;
        const rolAgentes = config.roles.agentesLibres;

        await interaction.guild.members.fetch();
        const agentes = interaction.guild.members.cache.filter(m =>
            m.roles.cache.has(rolAgentes) && !m.user.bot
        );

        if (agentes.size === 0) {
            return interaction.editReply({ content: '📭 No hay agentes libres en este momento.' });
        }

        const lista = agentes.map(m => `<@${m.id}>`);

        // Dividir en chunks de 30 y mandar de a un embed por mensaje
        const chunks = [];
        for (let i = 0; i < lista.length; i += 30) {
            chunks.push(lista.slice(i, i + 30));
        }

        // Primer mensaje con editReply
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🟢 Agentes Libres')
                    .setDescription(chunks[0].join('\n'))
                    .setColor(0x00C851)
                    .setFooter({ text: `Total: ${agentes.size} agentes libres — Página 1/${chunks.length}` })
                    .setTimestamp()
            ]
        });

        // Resto de páginas como followUp
        for (let i = 1; i < chunks.length; i++) {
            await interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🟢 Agentes Libres (cont.)')
                        .setDescription(chunks[i].join('\n'))
                        .setColor(0x00C851)
                        .setFooter({ text: `Total: ${agentes.size} agentes libres — Página ${i + 1}/${chunks.length}` })
                        .setTimestamp()
                ]
            });
        }
    }
};