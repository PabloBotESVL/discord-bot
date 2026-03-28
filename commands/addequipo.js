const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addequipo')
        .setDescription('Agrega un equipo a una división [Staff]')
        .addRoleOption(opt =>
            opt.setName('equipo')
                .setDescription('Rol del equipo')
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('division')
                .setDescription('División (1 o 2)')
                .setRequired(true)
                .addChoices(
                    { name: 'División 1', value: 1 },
                    { name: 'División 2', value: 2 }
                )
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede usar este comando.', ephemeral: true });
        }

        const rol = interaction.options.getRole('equipo');
        const division = interaction.options.getInteger('division');

        // Verificar que el rol sea un equipo válido del config
        if (!client.config.equipos.includes(rol.id)) {
            return interaction.reply({ content: `❌ **${rol.name}** no es un equipo de la liga.`, ephemeral: true });
        }

        const data = loadData();

        if (data.division1.includes(rol.id) || data.division2.includes(rol.id)) {
            return interaction.reply({ content: `⚠️ **${rol.name}** ya está en una división.`, ephemeral: true });
        }

        const maxEquipos = division === 1 ? 6 : 7;
        const divArray = division === 1 ? data.division1 : data.division2;

        if (divArray.length >= maxEquipos) {
            return interaction.reply({ content: `❌ La División ${division} ya tiene el máximo de equipos (${maxEquipos}).`, ephemeral: true });
        }

        divArray.push(rol.id);
        data.equipos[rol.id] = { puntos: 0, victorias: 0, derrotas: 0, jugadores: [], dt: null, subdt: null };
        saveData(data);

        await interaction.reply({ content: `✅ **${rol.name}** agregado a la División ${division}.` });
    }
};