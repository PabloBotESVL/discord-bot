const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadData, saveData } = require('./helpers');

const config = process.env.CONFIG
    ? JSON.parse(process.env.CONFIG)
    : JSON.parse(fs.readFileSync('./config.json'));

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
    // Manejo de botones
    if (interaction.isButton()) {
        const parts = interaction.customId.split('_');
        const accion = parts[0];
        const tipo = parts[1];

        // ── BAJA (demand) ──────────────────────────────────────────
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
                const iconoEquipo = equipo.imagen || null;
                const agentesLibresRolId = data.config?.agentesLibres || config?.roles?.agentesLibres;

                if (member) {
                    await member.roles.remove(equipoRolId).catch(() => {});
                    const enOtroEquipo = Object.values(data.equipos).some(eq => eq.jugadores?.includes(userId));
                    if (!enOtroEquipo && agentesLibresRolId) await member.roles.add(agentesLibresRolId).catch(() => {});
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

        // ── RESET TEMPORADA ────────────────────────────────────────
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

        // ── FICHAJE ────────────────────────────────────────────────
        if (accion === 'fichar') {
            const jugadorId = parts[2];
            const equipoRolId = parts[3];

            if (interaction.user.id !== jugadorId) {
                return interaction.reply({ content: '❌ Solo el jugador al que van a fichar puede responder esta propuesta.', ephemeral: true });
            }

            const data = loadData();
            const iconoEquipo = data.equipos[equipoRolId]?.imagen || null;
            const agentesLibresRolId = data.config?.agentesLibres || config?.roles?.agentesLibres;

            if (tipo === 'rechazar') {
                const embedRechazado = new EmbedBuilder()
                    .setTitle('❌ Fichaje Rechazado')
                    .setDescription(`<@&${equipoRolId}> envió una propuesta de fichaje a <@${jugadorId}>`)
                    .addFields(
                        { name: 'Jugador', value: `<@${jugadorId}>`, inline: false },
                        { name: 'Equipo', value: `<@&${equipoRolId}>`, inline: false },
                        { name: 'Estado', value: '❌ Rechazado por el jugador', inline: false }
                    )
                    .setColor(0xFF0000)
                    .setTimestamp();
                if (iconoEquipo) embedRechazado.setThumbnail(iconoEquipo);
                return interaction.update({ embeds: [embedRechazado], components: [] });
            }

            if (tipo === 'aceptar') {
                const equipo = data.equipos[equipoRolId];
                if (!equipo) {
                    return interaction.update({ content: '❌ El equipo ya no existe.', embeds: [], components: [] });
                }
                if (equipo.jugadores?.length >= 12) {
                    return interaction.update({ content: `❌ <@&${equipoRolId}> ya tiene 12 jugadores.`, embeds: [], components: [] });
                }

                if (!equipo.jugadores) equipo.jugadores = [];
                equipo.jugadores.push(jugadorId);
                saveData(data);

                const member = await interaction.guild.members.fetch(jugadorId).catch(() => null);
                if (member) {
                    await member.roles.add(equipoRolId).catch(() => {});
                    if (agentesLibresRolId) await member.roles.remove(agentesLibresRolId).catch(() => {});
                }

                const embedAceptado = new EmbedBuilder()
                    .setTitle('📥 Fichaje Confirmado')
                    .setDescription(`<@&${equipoRolId}> ha fichado a <@${jugadorId}>`)
                    .addFields(
                        { name: 'Jugador', value: `<@${jugadorId}>`, inline: false },
                        { name: 'Equipo', value: `<@&${equipoRolId}>`, inline: false },
                        { name: 'Estado', value: `✅ Aceptado — Nuevo jugador de <@&${equipoRolId}>`, inline: false }
                    )
                    .setColor(0x00C851)
                    .setTimestamp();
                if (iconoEquipo) embedAceptado.setThumbnail(iconoEquipo);
                return interaction.update({ embeds: [embedAceptado], components: [] });
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
        console.error(`Error ejecutando ${interaction.commandName}:`, error);
        const msg = { content: '❌ Ocurrió un error al ejecutar el comando.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg);
        } else {
            await interaction.reply(msg);
        }
    }
});

client.login(config.token);
