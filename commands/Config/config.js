const { enabled, disabled } = require('../../emojis');

module.exports.run = (client, message, args, data) => {
    return message.channel.send({ 
        embed: {
            color: client.config.embed.color,
            author: { icon_url: message.guild.iconURL({ dynamic: true }), name: message.guild.name },
            description: `**Configuration actuelle du serveur ${message.guild.name}** \nSi vous souhaitez activer des plugins, faites \`${data.prefix}enable <plugin>\`. Pour en désactiver faites \`${data.prefix}disable <plugin>\`. Pour plus d'informations, faites \`${data.prefix}help\`\n\u200b`,
            fields: [
                {
                    name: `${data.plugins.welcome.enabled ? enabled : disabled}  👋 Message de bienvenue`,
                    value: `\`\`\`\nMessage: ${data.plugins.welcome.message} \nSalon: ${data.plugins.welcome.channel ? checkDeleted('welcome') : 'MP'}\`\`\``,
                    inline: true
                },
                {
                    name: `${data.plugins.goodbye.enabled ? enabled : disabled}  💔 Message d\'aurevoir`,
                    value: `\`\`\`\nMessage: ${data.plugins.goodbye.message} \nSalon: ${data.plugins.goodbye.channel ? checkDeleted('goodbye') : 'MP'}\`\`\``,
                    inline: false
                },
                {
                    name: `${data.plugins.levels.enabled ? enabled : disabled}  🥇 Levels`,
                    value: `\`\`\`\nSalon de montées en niveau: ${data.plugins.levels.level_up_channel ? checkDeleted('levels', 'level_up_channel') : '`Aucun`'} \nMessage de montées de niveau: ${data.plugins.levels.level_up_message ? data.plugins.levels.level_up_message : 'GG {user} ! Tu passes niveau {level} !'}\`\`\``,
                    inline: false
                },
                {
                    name: `${data.plugins.economy.enabled ? enabled : disabled}  💵 Économie`,
                    value: `\`\`\`\nDevise: ${data.plugins.economy.currency}\`\`\``,
                    inline: true
                },
                {
                    name: `${data.plugins.logs.enabled ? enabled : disabled}  ⚒️ Modération`,
                    value: `\`\`\`\nSalon de logs: ${data.plugins.logs.channel ? checkDeleted('logs') : 'Aucun'}\`\`\``,
                    inline: true
                },
                {
                    name: `${data.plugins.suggestion.enabled ? enabled : disabled}  💡 Suggestions`,
                    value: `\`\`\`\nSalon: ${data.plugins.suggestion.channel ? checkDeleted('suggestion') : 'Aucun'}\`\`\``,
                    inline: true
                },
                {
                    name: '🛡️ Protection',
                    value: `\`\`\`\nCaptcha: ${data.plugins.protection.captcha?.enabled ? ' ✔️' : ' ❌'}\nRaidmode: ${data.plugins.protection.raidmode ? '✔️' : '❌'}\tAnti-give-role: ${data.plugins.protection.antigiverole ? '✔️' : '❌'} \nAntiban: ${data.plugins.protection.antiban ? ' ✔️' : ' ❌'}\tAntilien: ${data.plugins.protection.antilink ? '      ✔️' : '      ❌'} \nAntimaj: ${data.plugins.protection.antimaj ? ' ✔️' : ' ❌'}\tAntispam: ${data.plugins.protection.antispam?.enabled ? '      ✔️' : '      ❌'} \nSalon(s) ignoré(s): ${data.plugins.protection.ignored_channels?.length >= 1 ? data.plugins.protection.ignored_channels.map(c => `<#${c}>`).join(', ') : 'Aucun'} \nRôle(s) ignoré(s): ${data.plugins.protection.ignored_roles?.length >= 1 ? data.plugins.protection.ignored_roles.map(r => `<@&${r}>`).join(', ') : 'Aucun'}\`\`\``,
                    inline: true
                },
                {
                    name: '🎫 Tickets',
                    value: `\`\`\`\nNombre de panels: ${data.plugins.tickets?.panels?.length || '0'}\nSalon de logs: ${data.plugins.tickets?.logs_channel ? checkDeleted('tickets', 'logs_channel') : 'Aucun'}\nSalon des transcripts: ${data.plugins.tickets?.transcripts_channel ? checkDeleted('tickets', 'transcripts_channel') : 'Aucun'}\`\`\``
                }
            ],
            footer: { icon_url: client.user.displayAvatarURL(), text: client.config.embed.footer }
        } 
    });

    function checkDeleted(plugin, channelKey) {
        const channel = client.channels.cache.get(data.plugins[plugin][channelKey || 'channel']);
        if(!channel) return 'Salon supprimé';
        else return '#' + channel.name;
    }
}

module.exports.help = {
    name: "config",
    aliases: ["config"],
    category: 'Config',
    description: "Vérifier les paramètres de configuration du serveur",
    usage: "",
    cooldown: 5,
    memberPerms: ["MANAGE_GUILD"],
    botPerms: ["EMBED_LINKS"],
    args: false
}
