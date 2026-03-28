const { SlashCommandBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asignardt')
        .setDescription('Asigna DT o Sub-DT a un equipo [Staff]')
        .addRoleOption(opt =>
            opt.setName('equipo').setDescription('Equipo').setRequired(true)
        )
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Usuario a asignar').setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('cargo')
                .setDescription('Cargo a asignar')
                .setRequired(true)
                .addChoices(
                    { name: 'DT', value: 'dt' },
                    { name: 'Sub-DT', value: 'subdt' }
                )
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({ content: '❌ Solo el staff puede asignar DTs.', ephemeral: true });
        }

        const rol = interaction.options.getRole('equipo');
        const usuario = interaction.options.getUser('usuario');
        const cargo = interaction.options.getString('cargo');
        const data = loadData();

        if (!data.equipos[rol.id]) {
            return interaction.reply({ content: `❌ El equipo <@&${rol.id}> no está registrado.`, ephemeral: true });
        }

        data.equipos[rol.id][cargo] = usuario.id;
        saveData(data);

        const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
        if (member) {
            // Solo el DT recibe el rol de DT, el Sub-DT solo recibe el rol del equipo
            if (cargo === 'dt') {
                await member.roles.add(client.config.roles.dt).catch(() => {});
            }
            await member.roles.add(rol.id).catch(() => {});
        }

        const cargoLabel = cargo === 'dt' ? 'DT' : 'Sub-DT';
        await interaction.reply({ content: `✅ <@${usuario.id}> asignado como **${cargoLabel}** de <@&${rol.id}>.` });
    }
};
