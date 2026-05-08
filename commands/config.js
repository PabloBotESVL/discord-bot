const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadData, saveData } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configura los roles del bot [Admin]')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName('staff')
                .setDescription('Configura el rol de staff')
                .addRoleOption(opt => opt.setName('rol').setDescription('Rol de staff').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('dt')
                .setDescription('Configura el rol de DT')
                .addRoleOption(opt => opt.setName('rol').setDescription('Rol de DT').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('agenteslibres')
                .setDescription('Configura el rol de agentes libres')
                .addRoleOption(opt => opt.setName('rol').setDescription('Rol de agentes libres').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('ver')
                .setDescription('Muestra la configuración actual de roles')
        ),

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();
        const data = loadData();

        if (!data.config) data.config = {};

        if (sub === 'ver') {
            const staff = data.config.staff ? `<@&${data.config.staff}>` : '❌ No configurado';
            const dt = data.config.dt ? `<@&${data.config.dt}>` : '❌ No configurado';
            const agentes = data.config.agentesLibres ? `<@&${data.config.agentesLibres}>` : '❌ No configurado';

            return interaction.reply({
                content: `**⚙️ Configuración actual:**\n\n🛡️ **Staff:** ${staff}\n🎽 **DT:** ${dt}\n🟢 **Agentes Libres:** ${agentes}`,
                ephemeral: true
            });
        }

        const rol = interaction.options.getRole('rol');

        if (sub === 'staff') {
            data.config.staff = rol.id;
            saveData(data);
            return interaction.reply({ content: `✅ Rol de **Staff** configurado como <@&${rol.id}>.`, ephemeral: true });
        }

        if (sub === 'dt') {
            data.config.dt = rol.id;
            saveData(data);
            return interaction.reply({ content: `✅ Rol de **DT** configurado como <@&${rol.id}>.`, ephemeral: true });
        }

        if (sub === 'agenteslibres') {
            data.config.agentesLibres = rol.id;
            saveData(data);
            return interaction.reply({ content: `✅ Rol de **Agentes Libres** configurado como <@&${rol.id}>.`, ephemeral: true });
        }
    }
};
