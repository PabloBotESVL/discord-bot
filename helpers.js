const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const DATA_PATH = './data.json';

function loadData() {
    return JSON.parse(fs.readFileSync(DATA_PATH));
}

function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Verifica si el usuario tiene el rol de staff o admin
function esStaff(member, config) {
    return member.roles.cache.has(config.roles.staff) || member.permissions.has('Administrator');
}

// Devuelve el equipo al que pertenece un rol de Discord
function getEquipoPorRol(rolId, data) {
    return data.equipos[rolId] || null;
}

// Devuelve en qué división está un equipo (por su rolId)
function getDivisionDeEquipo(rolId, data) {
    if (data.division1.includes(rolId)) return 1;
    if (data.division2.includes(rolId)) return 2;
    return null;
}

// Construye el embed de tabla de posiciones para una división
function buildTablaEmbed(division, data, guild) {
    const equiposDiv = division === 1 ? data.division1 : data.division2;

    const filas = equiposDiv
        .map(rolId => {
            const eq = data.equipos[rolId] || {};
            const rol = guild.roles.cache.get(rolId);
            const nombre = rol ? rol.name : `Equipo (${rolId})`;
            const pj = (eq.victorias || 0) + (eq.derrotas || 0);
            return {
                nombre,
                pts: eq.puntos || 0,
                pj,
                v: eq.victorias || 0,
                d: eq.derrotas || 0
            };
        })
        .sort((a, b) => b.pts - a.pts);

    const descripcion = filas.length === 0
        ? '*No hay equipos en esta división todavía.*'
        : filas.map((f, i) =>
            `**${i + 1}.** ${f.nombre} — **${f.pts} pts** | PJ: ${f.pj} | V: ${f.v} | D: ${f.d}`
        ).join('\n');

    return new EmbedBuilder()
        .setTitle(`🏐 Tabla de Posiciones — División ${division}`)
        .setDescription(descripcion)
        .setColor(division === 1 ? 0xFFD700 : 0xC0C0C0)
        .setTimestamp();
}

module.exports = { loadData, saveData, esStaff, getEquipoPorRol, getDivisionDeEquipo, buildTablaEmbed };
