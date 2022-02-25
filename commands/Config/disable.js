module.exports.run = async (client, message, args, data) => {
    let plugin = args[0];

    switch (plugin?.toLowerCase()) {
        case "protection": {
            message.channel.send('ℹ️ Le plugin protection n\'est pas activable. Vous pouvez activer le raidmode, l\'antigiverole, l\'antilien ou l\'antiban séparément via leur commande respective (ex: `' + data.prefix + 'raidmode`)');
            break;
        }
        case "welcome": {
            if(data.plugins.welcome.enabled) {
                data.plugins.welcome.enabled = false;

                data.markModified("plugins.welcome.enabled");
                data.save();

                message.channel.send('✅ Le plugin `welcome` a bien été **désactivé**.')
            } else {
                message.channel.send('⚠️ Le plugin `welcome` est déjà désactivé.');
            }

            break;
        }
        case "goodbye": {
            if(data.plugins.goodbye.enabled) {
                data.plugins.goodbye.enabled = false;

                data.markModified("plugins.goodbye.enabled");
                data.save();

                message.channel.send('✅ Le plugin `goodbye` a bien été **désactivé**.');
            } else {
                message.channel.send('⚠️ Le plugin `goodbye` est déjà désactivé.');
            }

            break;
        }
        case "logs": {
            if(data.plugins.logs.enabled) {
                data.plugins.logs.enabled = false;

                data.markModified("plugins.logs.enabled");
                data.save();

                message.channel.send('✅ Le plugin `logs` a bien été **désactivé**.');
            } else {
                message.channel.send('⚠️ Le plugin `logs` est déjà désactivé.');
            }

            break;
        }
        case "autorole": {
            if(data.plugins.autorole.enabled) {
                data.plugins.autorole.enabled = false;

                data.markModified("plugins.autorole.enabled");
                data.save();

                message.channel.send('✅ Le plugin `autorole` a bien été **désactivé**.');
            } else {
                message.channel.send('⚠️ Le plugin `autorole` est déjà désactivé.');
            }

            break;
        }
        case "suggestion": {
            if(data.plugins.suggestion.enabled) {
                data.plugins.suggestion.enabled = false;

                data.markModified("plugins.suggestion.enabled");
                data.save();

                message.channel.send('✅ Le plugin `suggestion` a bien été **désactivé**.');
            } else {
                message.channel.send('⚠️ Le plugin `suggestion` est déjà désactivé.');
            }

            break;
        }
        case "levels": {
            if(data.plugins.levels.enabled) {
                data.plugins.levels.enabled = false;

                data.markModified("plugins.levels.enabled");
                data.save();

                message.channel.send('✅ Le plugin `levels` a bien été **désactivé**.');
            } else {
                message.channel.send('⚠️ Le plugin `levels` est déjà désactivé.');
            }

            break;
        }
        case "economy": {
            if(data.plugins.economy.enabled) {
                data.plugins.economy.enabled = false;

                data.markModified("plugins.economy.enabled");
                data.save();

                message.channel.send('✅ Le plugin `economy` a bien été **désactivé**.');
            } else {
                message.channel.send('⚠️ Le plugin `economy` est déjà désactivé.');
            }

            break;
        }
        default: {
            message.channel.send('⚠️ Ce plugin n\'existe pas. Voici la liste des plugins: `welcome`, `goodbye`, `logs`, `autorole`, `suggestion`, `levels`, `economy`. \nVous ne trouvez pas ce que vous voulez ? Faites `' + data.prefix + 'config` pour voir les autres configurations. Le module de protection s\'active séparement via les commandes `raidmode`, `antigiverole`, `antiban`, `antilink`.');
        }
    }
}

module.exports.help = {
    name: "disable",
    aliases: ["disable", "disable-plugin", "disableplugins", "disable-plugins", "disableplugin"],
    category: 'Config',
    description: "Désactiver certains plugins",
    usage: "<plugin>",
    cooldown: 5,
    memberPerms: ["MANAGE_GUILD"],
    botPerms: [],
    args: false
}
