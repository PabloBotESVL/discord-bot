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
                    { name: 'Sub-DT 1', value: 'subdt' },
                    { name: 'Sub-DT 2', value: 'subdt2' }
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
            return interaction.reply({ content: `❌ <@&${rol.id}> no está registrado.`, ephemeral: true });
        }

        data.equipos[rol.id][cargo] = usuario.id;
        saveData(data);

        const dtRolId = data.config?.dt || client.config?.roles?.dt;
        const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
        if (member) {
            // Solo el DT recibe el rol de DT, los Sub-DTs solo el rol del equipo
            if (cargo === 'dt' && dtRolId) await member.roles.add(dtRolId).catch(() => {});
            await member.roles.add(rol.id).catch(() => {});
        }

        const cargoLabel = cargo === 'dt' ? 'DT' : cargo === 'subdt' ? 'Sub-DT 1' : 'Sub-DT 2';
        await interaction.reply({ content: `✅ <@${usuario.id}> asignado como **${cargoLabel}** de <@&${rol.id}>.` });
    }
};
