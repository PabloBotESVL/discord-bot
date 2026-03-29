const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadData, saveData } = require('./helpers');

// ✅ CONFIG ARREGLADO
const config = {
    token: process.env.TOKEN,
    roles: {
        agentesLibres: process.env.AGENTES_LIBRES
    },
    canalAvisos: process.env.CANAL_AVISOS,
    canalResultados: process.env.CANAL_RESULTADOS
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
client.config = config;

// Cargar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    }
}

// Eventos
client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const parts = interaction.customId.split('_');
        const accion = parts[0];
        const tipo = parts[1];

        if (accion === 'baja') {
            if (tipo === 'cancelar') {
                return interaction.update({ content: '✅ Baja cancelada.', embeds: [], components: [] });
            }

            if (tipo === 'confirmar') {
                const equipoRolId = parts[2];
                const userId = parts[3];

                if (interaction.user.id !== userId) {
                    return interaction.reply({ content: '❌ Este botón no es tuyo.', ephemeral: true });
                }

                const data = loadData();
                const equipo = data.equipos[equipoRolId];

                if (!equipo || !equipo.jugadores?.includes(userId)) {
                    return interaction.update({ content: '❌ Ya no estás en ese equipo.', embeds: [], components: [] });
                }

                equipo.jugadores = equipo.jugadores.filter(id => id !== userId);
                saveData(data);

                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                const rol = interaction.guild.roles.cache.get(equipoRolId);
                const nombreEquipo = rol ? rol.name : 'el equipo';
                const iconoEquipo = equipo.imagen || null;

                if (member) {
                    await member.roles.remove(equipoRolId).catch(() => {});
                    const enOtroEquipo = Object.values(data.equipos).some(eq => eq.jugadores?.includes(userId));
                    if (!enOtroEquipo) await member.roles.add(config.roles.agentesLibres).catch(() => {});
                }

                await interaction.update({ content: `✅ Te diste de baja de <@&${equipoRolId}> correctamente.`, embeds: [], components: [] });

                const canalAvisos = config.canalAvisos
                    ? interaction.guild.channels.cache.get(config.canalAvisos)
                    : null;

                if (canalAvisos) {
                    const embed = new EmbedBuilder()
                        .setTitle('📤 Baja Solicitada')
                        .setDescription(`<@${userId}> ha solicitado darse de baja de <@&${equipoRolId}>`)
                        .addFields(
                            { name: 'Jugador', value: `<@${userId}>`, inline: false },
                            { name: 'Equipo anterior', value: `<@&${equipoRolId}>`, inline: false },
                            { name: 'Nuevo estado', value: 'Agente Libre', inline: false }
                        )
                        .setColor(0xFF6B00)
                        .setTimestamp();

                    if (iconoEquipo) embed.setThumbnail(iconoEquipo);

                    await canalAvisos.send({ embeds: [embed] });
                }
            }
        }

        if (accion === 'reset') {
            if (parts[1] === 'cancelar') {
                return interaction.update({ content: '✅ Reset cancelado.', embeds: [], components: [] });
            }

            if (parts[1] === 'confirmar') {
                const userId = parts[2];
                const nuevaTemporada = decodeURIComponent(parts[3]);

                if (interaction.user.id !== userId) {
                    return interaction.reply({ content: '❌ Este botón no es tuyo.', ephemeral: true });
                }

                const data = loadData();

                for (const rolId in data.equipos) {
                    data.equipos[rolId].puntos = 0;
                    data.equipos[rolId].victorias = 0;
                    data.equipos[rolId].derrotas = 0;
                }

                data.historial = [];
                data.fixture = [];
                data.temporada = nuevaTemporada;
                saveData(data);

                const embed = new EmbedBuilder()
                    .setTitle('🔄 Temporada Reseteada')
                    .setDescription(`La temporada ha sido reseteada correctamente.\n\n**Nueva temporada:** ${nuevaTemporada}`)
                    .setColor(0x00C851)
                    .setTimestamp();

                await interaction.update({ embeds: [embed], components: [] });

                const canalResultados = config.canalResultados
                    ? interaction.guild.channels.cache.get(config.canalResultados)
                    : null;
                if (canalResultados) await canalResultados.send({ embeds: [embed] });
            }
        }

        if (accion === 'fichar') {
            const jugadorId = parts[2];
            const equipoRolId = parts[3];

            if (interaction.user.id !== jugadorId) {
                return interaction.reply({ content: '❌ Solo el jugador puede responder.', ephemeral: true });
            }

            const data = loadData();
            const rol = interaction.guild.roles.cache.get(equipoRolId);
            const nombreEquipo = rol ? rol.name : 'el equipo';
            const iconoEquipo = data.equipos[equipoRolId]?.imagen || null;

            if (tipo === 'rechazar') {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Fichaje Rechazado')
                    .setDescription(`**${nombreEquipo}** intentó fichar a <@${jugadorId}>`)
                    .setColor(0xFF0000);

                if (iconoEquipo) embed.setThumbnail(iconoEquipo);
                return interaction.update({ embeds: [embed], components: [] });
            }

            if (tipo === 'aceptar') {
                const equipo = data.equipos[equipoRolId];
                if (!equipo) return interaction.update({ content: '❌ Equipo no existe.', embeds: [], components: [] });

                if (!equipo.jugadores) equipo.jugadores = [];
                equipo.jugadores.push(jugadorId);
                saveData(data);

                const member = await interaction.guild.members.fetch(jugadorId).catch(() => null);
                if (member) {
                    await member.roles.add(equipoRolId).catch(() => {});
                    await member.roles.remove(config.roles.agentesLibres).catch(() => {});
                }

                return interaction.update({ content: `✅ Fichaje confirmado en ${nombreEquipo}`, components: [] });
            }
        }

        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Error al ejecutar.', ephemeral: true });
    }
});

// ✅ LOGIN CORREGIDO
client.login(config.token);