const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bajar')
        .setDescription('Baja un jugador de un equipo [Staff/DT]')
        .addUserOption(opt =>
            opt.setName('jugador').setDescription('Usuario a dar de baja').setRequired(true)
        )
        .addRoleOption(opt =>
            opt.setName('equipo').setDescription('Equipo del que se baja').setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('motivo').setDescription('Motivo de la baja').setRequired(true)
        ),

    async execute(interaction, client) {
        const esDT = interaction.member.roles.cache.has(client.config.roles.dt);
        if (!esStaff(interaction.member, client.config) && !esDT) {
            return interaction.reply({ content: '❌ Solo el staff o los DTs pueden bajar jugadores.', ephemeral: true });
        }

        const jugador = interaction.options.getUser('jugador');
        const rol = interaction.options.getRole('equipo');
        const motivo = interaction.options.getString('motivo');
        const data = loadData();

        if (!data.equipos[rol.id]) {
            return interaction.reply({ content: `❌ El equipo <@&${rol.id}> no está registrado.`, ephemeral: true });
        }

        const equipo = data.equipos[rol.id];

        if (!equipo.jugadores || !equipo.jugadores.includes(jugador.id)) {
            return interaction.reply({ content: `⚠️ <@${jugador.id}> no está en <@&${rol.id}>.`, ephemeral: true });
        }

        equipo.jugadores = equipo.jugadores.filter(id => id !== jugador.id);
        saveData(data);

        const member = await interaction.guild.members.fetch(jugador.id).catch(() => null);
        if (member) {
            await member.roles.remove(rol.id).catch(() => {});
            const enOtroEquipo = Object.values(data.equipos).some(eq => eq.jugadores && eq.jugadores.includes(jugador.id));
            if (!enOtroEquipo) {
                await member.roles.add(client.config.roles.agentesLibres).catch(() => {});
            }
        }

        // Notificar al canal de avisos
        const canalAvisos = client.config.canalAvisos
            ? interaction.guild.channels.cache.get(client.config.canalAvisos)
            : null;

        if (canalAvisos) {
            const { EmbedBuilder } = require('discord.js');
            const iconoEquipo = equipo.imagen || null;
            const embed = new EmbedBuilder()
                .setTitle('📤 Baja de Jugador')
                .setDescription(`<@${jugador.id}> ha sido dado de baja de <@&${rol.id}>`)
                .addFields(
                    { name: 'Jugador', value: `<@${jugador.id}>`, inline: false },
                    { name: 'Equipo anterior', value: `<@&${rol.id}>`, inline: false },
                    { name: 'Motivo', value: motivo, inline: false },
                    { name: 'Nuevo estado', value: 'Agente Libre', inline: false }
                )
                .setColor(0xFF6B00)
                .setTimestamp();

            if (iconoEquipo) embed.setThumbnail(iconoEquipo);
            await canalAvisos.send({ embeds: [embed] });
        }

        await interaction.reply({ content: `✅ <@${jugador.id}> dado de baja de <@&${rol.id}>.\n📝 Motivo: ${motivo}`, ephemeral: true });
    }
};