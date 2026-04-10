const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea o desbanea un jugador de la liga [Staff]')
        .addSubcommand(sub =>
            sub.setName('dar')
                .setDescription('Banea un jugador')
                .addUserOption(opt => opt.setName('jugador').setDescription('Jugador').setRequired(true))
                .addStringOption(opt => opt.setName('motivo').setDescription('Motivo').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('quitar')
                .setDescription('Desbanea un jugador')
                .addUserOption(opt => opt.setName('jugador').setDescription('Jugador').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('lista')
                .setDescription('Ver todos los jugadores baneados')
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const data = loadData();
        if (!data.bans) data.bans = [];

        const agentesLibresRolId = data.config?.agentesLibres || client.config?.roles?.agentesLibres;
        const dtRolId = data.config?.dt || client.config?.roles?.dt;

        if (sub === 'dar') {
            const jugador = interaction.options.getUser('jugador');
            const motivo = interaction.options.getString('motivo');

            if (data.bans.find(b => b.id === jugador.id)) {
                return interaction.reply({ content: `⚠️ <@${jugador.id}> ya está baneado.`, ephemeral: true });
            }

            for (const rolId in data.equipos) {
                const eq = data.equipos[rolId];
                if (eq.jugadores) eq.jugadores = eq.jugadores.filter(id => id !== jugador.id);
                if (eq.dt === jugador.id) eq.dt = null;
                if (eq.subdt === jugador.id) eq.subdt = null;
            }

            data.bans.push({ id: jugador.id, username: jugador.username, motivo, fecha: new Date().toISOString() });
            saveData(data);

            const member = await interaction.guild.members.fetch(jugador.id).catch(() => null);
            if (member) {
                if (agentesLibresRolId) await member.roles.remove(agentesLibresRolId).catch(() => {});
                if (dtRolId) await member.roles.remove(dtRolId).catch(() => {});
            }

            const embed = new EmbedBuilder()
                .setTitle('🔨 Jugador Baneado')
                .setDescription(`<@${jugador.id}> ha sido baneado de la liga.\n**Motivo:** ${motivo}`)
                .setColor(0xFF0000)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });

        } else if (sub === 'quitar') {
            const jugador = interaction.options.getUser('jugador');
            const index = data.bans.findIndex(b => b.id === jugador.id);
            if (index === -1) {
                return interaction.reply({ content: `⚠️ <@${jugador.id}> no está baneado.`, ephemeral: true });
            }
            data.bans.splice(index, 1);
            saveData(data);
            await interaction.reply({ content: `✅ <@${jugador.id}> desbaneado de la liga.` });

        } else if (sub === 'lista') {
            if (!data.bans.length) {
                return interaction.reply({ content: '✅ No hay jugadores baneados.', ephemeral: true });
            }
            const desc = data.bans.map((b, i) =>
                `**${i + 1}.** <@${b.id}> — ${b.motivo}`
            ).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('🔨 Jugadores Baneados')
                .setDescription(desc)
                .setColor(0xFF0000);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
