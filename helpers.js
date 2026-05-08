const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const DATA_PATH = './data.json';

function loadData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH));
    } catch {
        const dataInicial = {
            division1: [],
            division2: [],
            equipos: {},
            advertencias: {},
            bans: [],
            historial: [],
            fixture: [],
            mvps: [],
            mvpsEquipos: [],
            warnsEquipos: {},
            config: {}
        };
        fs.writeFileSync(DATA_PATH, JSON.stringify(dataInicial, null, 2));
        return dataInicial;
    }
}

function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// Lee el rol de staff desde data.json, config.json o por ID fijo
function esStaff(member, config) {
    const data = loadData();
    const staffRolId = data.config?.staff || config?.roles?.staff || '1480013310358323385';
    return member.roles.cache.has(staffRolId) || member.permissions.has('Administrator');
}

function getEquipoPorRol(rolId, data) {
    return data.equipos[rolId] || null;
}

function getDivisionDeEquipo(rolId, data) {
    if (!data.division1 || !data.division2) return null;
    if (data.division1.includes(rolId)) return 1;
    if (data.division2.includes(rolId)) return 2;
    return null;
}

function buildTablaEmbed(division, data, guild) {
    const equiposDiv = division === 1 ? (data.division1 || []) : (data.division2 || []);

    const filas = equiposDiv
        .map(rolId => {
            const eq = data.equipos[rolId] || {};
            const rol = guild.roles.cache.get(rolId);
            // Usar nombre guardado en data.equipos si el rol no se encuentra
            const nombre = rol ? rol.name : (eq.nombre || `Equipo (${rolId})`);
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
