const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea un jugador de la liga [Staff]')
        .addUserOption(opt => opt.setName('jugador').setDescription('Jugador a banear').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo del ban').setRequired(true)),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const jugador = interaction.options.getUser('jugador');
        const motivo = interaction.options.getString('motivo');
        const data = loadData();
        if (!data.bans) data.bans = [];

        if (data.bans.find(b => b.id === jugador.id)) {
            return interaction.reply({ content: `⚠️ <@${jugador.id}> ya está baneado.`, ephemeral: true });
        }

        for (const rolId in data.equipos) {
            const eq = data.equipos[rolId];
            if (eq.jugadores) eq.jugadores = eq.jugadores.filter(id => id !== jugador.id);
            if (eq.dt === jugador.id) eq.dt = null;
            if (eq.subdt === jugador.id) eq.subdt = null;
            if (eq.subdt2 === jugador.id) eq.subdt2 = null;
        }

        data.bans.push({ id: jugador.id, username: jugador.username, motivo, fecha: new Date().toISOString() });
        saveData(data);

        const agentesLibresRolId = data.config?.agentesLibres || client.config?.roles?.agentesLibres;
        const dtRolId = data.config?.dt || client.config?.roles?.dt;
        const member = await interaction.guild.members.fetch(jugador.id).catch(() => null);
        if (member) {
            if (agentesLibresRolId) await member.roles.remove(agentesLibresRolId).catch(() => {});
            if (dtRolId) await member.roles.remove(dtRolId).catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setTitle('🔨 Jugador Baneado')
            .addFields(
                { name: 'Jugador', value: `<@${jugador.id}>`, inline: false },
                { name: 'Motivo', value: motivo, inline: false }
            )
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
