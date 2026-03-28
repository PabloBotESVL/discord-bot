const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData, esStaff } = require('../helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('descender')
        .setDescription('Desciende un equipo a División 2 [Staff]')
        .addRoleOption(opt =>
            opt.setName('equipo')
                .setDescription('Rol del equipo a descender')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        if (!esStaff(interaction.member, client.config)) {
            return interaction.reply({
                content: '❌ Solo el staff puede usar este comando.',
                ephemeral: true
            });
        }

        const rol = interaction.options.getRole('equipo');
        const data = loadData();

        // Inicializar arrays si no existen
        if (!data.division1) data.division1 = [];
        if (!data.division2) data.division2 = [];

        const enDiv1 = data.division1.includes(rol.id);
        const enDiv2 = data.division2.includes(rol.id);

        if (!enDiv1 && !enDiv2) {
            return interaction.reply({
                content: `❌ **${rol.name}** no está registrado en ninguna división. Usá **/addequipo** primero.`,
                ephemeral: true
            });
        }

        if (enDiv2) {
            return interaction.reply({
                content: `⚠️ **${rol.name}** ya está en División 2.`,
                ephemeral: true
            });
        }

        // Mover de div1 a div2
        data.division1 = data.division1.filter(id => id !== rol.id);
        data.division2.push(rol.id);
        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle('⬇️ Descenso Confirmado')
            .setDescription(`**${rol.name}** ha descendido a la **División 2**.`)
            .setColor(0xC0C0C0)
            .setFooter({ text: `División 1: ${data.division1.length}/6 • División 2: ${data.division2.length}/7` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};