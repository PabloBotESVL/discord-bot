const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transferir')
        .setDescription('Transfiere un jugador de un equipo a otro directamente [Staff]')
        .addUserOption(opt =>
            opt.setName('jugador').setDescription('Jugador a transferir').setRequired(true)
        )
        .addRoleOption(opt =>
            opt.setName('destino').setDescription('Equipo destino').setRequired(true)
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const jugador = interaction.options.getUser('jugador');
        const rolDestino = interaction.options.getRole('destino');
        const data = loadData();

        if (!data.equipos[rolDestino.id]) {
            return interaction.reply({ content: `❌ <@&${rolDestino.id}> no está registrado.`, ephemeral: true });
        }

        // Buscar equipo origen
        let equipoOrigenId = null;
        for (const rolId in data.equipos) {
            if (data.equipos[rolId].jugadores?.includes(jugador.id)) {
                equipoOrigenId = rolId;
                break;
            }
        }

        if (!equipoOrigenId) {
            return interaction.reply({ content: `❌ <@${jugador.id}> no está en ningún equipo.`, ephemeral: true });
        }

        if (equipoOrigenId === rolDestino.id) {
            return interaction.reply({ content: `⚠️ <@${jugador.id}> ya está en <@&${rolDestino.id}>.`, ephemeral: true });
        }

        const equipoDestino = data.equipos[rolDestino.id];
        if (!equipoDestino.jugadores) equipoDestino.jugadores = [];

        if (equipoDestino.jugadores.length >= 12) {
            return interaction.reply({ content: `❌ <@&${rolDestino.id}> ya tiene el máximo de 12 jugadores.`, ephemeral: true });
        }

        // Quitar del equipo origen
        data.equipos[equipoOrigenId].jugadores = data.equipos[equipoOrigenId].jugadores.filter(id => id !== jugador.id);
        // Agregar al equipo destino
        equipoDestino.jugadores.push(jugador.id);
        saveData(data);

        // Actualizar roles en Discord
        const member = await interaction.guild.members.fetch(jugador.id).catch(() => null);
        if (member) {
            await member.roles.remove(equipoOrigenId).catch(() => {});
            await member.roles.add(rolDestino.id).catch(() => {});
        }

        const iconoDestino = equipoDestino.imagen || null;

        const embed = new EmbedBuilder()
            .setTitle('🔄 Transferencia Confirmada')
            .setDescription(`<@${jugador.id}> ha sido transferido a <@&${rolDestino.id}>`)
            .addFields(
                { name: 'Jugador', value: `<@${jugador.id}>`, inline: false },
                { name: 'Equipo anterior', value: `<@&${equipoOrigenId}>`, inline: false },
                { name: 'Equipo nuevo', value: `<@&${rolDestino.id}>`, inline: false }
            )
            .setColor(0x5865F2)
            .setTimestamp();

        if (iconoDestino) embed.setThumbnail(iconoDestino);

        // Notificar al canal de disciplina
        const canalAvisos = client.config.canalAvisos
            ? interaction.guild.channels.cache.get(client.config.canalAvisos)
            : null;
        if (canalAvisos) await canalAvisos.send({ embeds: [embed] });

        await interaction.reply({ embeds: [embed] });
    }
};
