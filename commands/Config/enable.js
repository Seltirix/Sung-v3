module.exports.run = async (client, message, args, data) => {
    let plugin = args[0];

    switch (plugin?.toLowerCase()) {
        case "protection": {
            message.channel.send('ℹ️ Le plugin protection n\'est pas activable. Vous pouvez activer le raidmode, l\'antigiverole, l\'antilien ou l\'antiban séparément via leur commande respective (ex: `' + data.prefix + 'raidmode`)');
            break;
        }
        case "welcome": {
            if(!data.plugins.welcome.enabled) {
                data.plugins.welcome.enabled = true;

                data.markModified("plugins.welcome.enabled");
                data.save();

                message.channel.send(`✅ Le plugin \`welcome\` a bien été **activé**.\nFaites \`${data.prefix}welcome message\` pour configurer le message de bienvenue, \`${data.prefix}welcome channel\` pour configurer le salon de bienvenue et \`${data.prefix}welcome test\` pour tester !`);
            } else {
                message.channel.send('⚠️ Le plugin `welcome` est déjà activé.');
            }

            break;
        };
        case "goodbye": {
            if(!data.plugins.goodbye.enabled) {
                data.plugins.goodbye.enabled = true;

                data.markModified("plugins.goodbye.enabled");
                data.save();

                message.channel.send(`✅ Le plugin \`goodbye\` a bien été **activé**.\nFaites \`${data.prefix}goodbye message\` pour configurer le message d'aurevoir, \`${data.prefix}goodbye channel\` pour configurer le salon d'aurevoir et \`${data.prefix}goodbye test\` pour tester !`);
            } else {
                message.channel.send('⚠️ Le plugin `goodbye` est déjà activé.')
            }

            break;
        };
        case "logs": {
            if(!data.plugins.logs.enabled) {
                data.plugins.logs.enabled = true;

                data.markModified("plugins.logs.enabled");
                data.save();

                message.channel.send(`✅ Le plugin \`logs\` a bien été **désactivé**.\nFaites \`${data.prefix}logschannel <channel>\` pour configurer le salon des logs`);
            } else {
                message.channel.send('⚠️ Le plugin `logs` est déjà activé.')
            }

            break;
        };
        case "autorole": {
            if(!data.plugins.autorole.enabled) {
                data.plugins.autorole.enabled = true;

                data.markModified("plugins.autorole.enabled");
                data.save();

                message.channel.send(`✅ Le plugin \`autorole\` a bien été **activé**.\nFaites \`${data.prefix}autorole <role>\` pour définir un rôle à donner aux nouveaux arrivants !`);
            } else {
                message.channel.send('⚠️ Le plugin `autorole` est déjà activé.');
            }

            break;
        };
        case "suggestion": {
            if(!data.plugins.suggestion.enabled) {
                data.plugins.suggestion.enabled = true;

                data.markModified("plugins.suggestion.enabled");
                data.save();

                message.channel.send(`✅ Le plugin \`suggestion\` a bien été **activé**.\nFaites \`${data.prefix}suggestion-channel <channel>\` pour définir le salon des suggestions !`);
            } else {
                message.channel.send('⚠️ Le plugin `suggestion` est déjà activé.');
            }

            break;
        }
        case "levels": {
            if(!data.plugins.levels.enabled) {
                data.plugins.levels.enabled = true;

                data.markModified("plugins.levels.enabled");
                data.save();

                message.channel.send(`✅ Le plugin \`levels\` a bien été **activé**.\nRetrouvez les commandes de levels dans la catégorie levels !`);
            } else {
                message.channel.send('⚠️ Le plugin `levels` est déjà activé.');
            }

            break;
        }
        case "economy": {
            if(!data.plugins.economy.enabled) {
                data.plugins.economy.enabled = true;

                data.markModified("plugins.economy.enabled");
                data.save();

                message.channel.send(`✅ Le plugin \`economy\` a bien été **activé**.\nRetrouvez toutes les commandes d'économie dans la catégorie economy`);
            } else {
                message.channel.send('⚠️ Le plugin `economy` est déjà activé.');
            }

            break;
        }
        default: {
            message.channel.send('⚠️ Ce plugin n\'existe pas. Voici la liste des plugins: `welcome`, `goodbye`, `logs`, `autorole`, `suggestion`, `levels`, `economy`. \nVous ne trouvez pas ce que vous voulez ? Faites `' + data.prefix + 'config` pour voir les autres configurations. Le module de protection s\'active séparement via les commandes `raidmode`, `antigiverole`, `antiban`, `antilink`.');
        }
    }
}

module.exports.help = {
    name: "enable",
    aliases: ["enable", "enable-plugin", "enableplugins", "enable-plugins", "enableplugin"],
    category: 'Config',
    description: "Activer certains plugins",
    usage: "<plugin>",
    cooldown: 5,
    memberPerms: ["MANAGE_GUILD"],
    botPerms: [],
    args: false
}
