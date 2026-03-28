const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('advertencia')
        .setDescription('Gestiona advertencias de un jugador [Staff]')
        .addSubcommand(sub =>
            sub.setName('dar')
                .setDescription('Da una advertencia a un jugador')
                .addUserOption(opt => opt.setName('jugador').setDescription('Jugador').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Motivo').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('ver')
                .setDescription('Ver advertencias de un jugador')
                .addUserOption(opt => opt.setName('jugador').setDescription('Jugador').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('quitar')
                .setDescription('Quita una advertencia a un jugador')
                .addUserOption(opt => opt.setName('jugador').setDescription('Jugador').setRequired(true))
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const jugador = interaction.options.getUser('jugador');
        const data = loadData();

        if (!data.advertencias) data.advertencias = {};
        if (!data.advertencias[jugador.id]) data.advertencias[jugador.id] = [];

        if (sub === 'dar') {
            const motivo = interaction.options.getString('motivo');
            data.advertencias[jugador.id].push({ motivo, fecha: new Date().toISOString() });
            saveData(data);

            const total = data.advertencias[jugador.id].length;
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Advertencia Registrada')
                .addFields(
                    { name: 'Jugador', value: `<@${jugador.id}>`, inline: false },
                    { name: 'Motivo', value: motivo, inline: false },
                    { name: 'Total advertencias', value: `${total}`, inline: false }
                )
                .setColor(0xFFA500)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (sub === 'ver') {
            const lista = data.advertencias[jugador.id];
            if (!lista || lista.length === 0) {
                return interaction.reply({ content: `✅ <@${jugador.id}> no tiene advertencias.`, ephemeral: true });
            }

            const desc = lista.map((a, i) =>
                `**${i + 1}.** ${a.motivo} — <t:${Math.floor(new Date(a.fecha).getTime() / 1000)}:d>`
            ).join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`⚠️ Advertencias de ${jugador.username}`)
                .setDescription(desc)
                .setColor(0xFFA500);

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (sub === 'quitar') {
            if (!data.advertencias[jugador.id].length) {
                return interaction.reply({ content: `⚠️ <@${jugador.id}> no tiene advertencias.`, ephemeral: true });
            }
            data.advertencias[jugador.id].pop();
            saveData(data);
            await interaction.reply({ content: `✅ Última advertencia de <@${jugador.id}> eliminada.` });
        }
    }
};