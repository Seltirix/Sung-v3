const emojis = require('../../emojis');
const Game = require('../../models/games/Game');
const Uno = require('../../models/games/Uno');
const User = require('../../models/User');
 
module.exports.run = async (client, message, args, data) => {
    if(args[0]?.toLowerCase() === 'help') {
        return message.channel.send({
            embed: {
                color: client.config.embed.color,
                author: { name: message.author.tag, icon_url: message.author.displayAvatarURL({ dynamic: true }) },
                title: 'Uno - Comment jouer ?',
                description: `Pour **démarrer une partie de uno**, faites \`${data.prefix}uno\`, et un matchmaking se lance.\n➔ Les joueurs voulant vous rejoindre peuvent cliquer sur la **réaction ${emojis.join}**.\n➔ Lorsque que vous êtes minimum deux joueurs, vous pouvez lancer la partie en cliquant sur la **réaction ${emojis.yes}**.\n\nUne fois la partie lancée, le bot va envoyer **dans le salon la table du jeu**, avec la **carte actuelle** et le **joueur actuel**. L'avatar entouré en rouge correspond au joueur actuel.\nLe bot vous a envoyé en Messages Privés vos cartes avec un numéro en dessus de chaque carte. **Ce numéro vous sert à jouer la carte indiquée**. Lorsque c'est à votre tour de jouer, envoyez en MP le numéro de la carte indiquée en dessous de celle-ci pour la jouer.\n*Et si vous souhaitez supprimer votre partie en cours, vous pouvez utiliser la commande \`${data.prefix}uno delete\` (créateur uniquement).*\nSi vous avez encore besoin d'aide, n'hésitez pas à nous le faire savoir sur [notre support](https://discord.gg/SSWQamBCFE).`,
                footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
            }
        });
    }

    if(args[0]?.toLowerCase() === 'delete') {
        const foundGame = client.games.find((game) => game instanceof Uno && game.players.find((p) => p.id === message.author.id));
        if(!foundGame || foundGame.players[0].id !== message.author.id) return message.channel.send('⚠️ Vous n\'avez créé aucune partie de uno en cours !');
        foundGame.destroy();
        return message.channel.send('✅ **La partie a bien été annulée.**');
    }

    if(Game.findGameByUser(client, message.author)) return message.channel.send(`⚠️ Vous jouez déjà à un autre jeu ${message.author} ! Finissez votre partie et vous pourrez participer.`);

    // const dbA = await User.findOne({ id: message.author.id });
    // if(dbA?.uno_played) {
    //     if(dbA.uno_played.filter((timestamp) => timestamp + (1000 * 60 * 60 * 24) > Date.now()).length >= 4) return message.channel.send(`⚠️ Vous avez atteint votre limite de 4 parties de Uno par jour ! Revenez dans 24h ou achetez le premium (\`${data.prefix}premium\`).`);
    //     dbA.uno_played = dbA.uno_played.filter((timestamp) => timestamp + (1000 * 60 * 60 * 24) < Date.now());
    //     dbA.markModified('uno_played');
    //     await dbA.save();
    // }

    const reactions = {
        [emojis.join]: 'Rejoindre la partie',
        [emojis.leave]: 'Quitter la partie',
        [emojis.yes]: 'Lancer la partie (créateur uniquement)',
        [emojis.no]: 'Annuler la partie (créateur uniquement)',
    }
    const embed = {
        color: client.config.embed.color,
        author: { name: `${message.author.tag} a lancé une partie de Uno !`, icon_url: message.author.displayAvatarURL({ dynamic: true }) },
        description: '**Cliquez sur les réactions pour rejoindre ou quitter la partie !**\n\n' + Object.entries(reactions).map((r) => r[0] + ' ➔ ' + r[1]).join('\n'),
        fields: [{ name: '**Joueurs en attente**', value: `**- ${message.author}**` }],
        footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
    };

    const awaitUsers = await message.channel.send({ embed });

    Object.keys(reactions).forEach(async (r) => {
        await awaitUsers.react(r.split(':')[2].replace('>', ''));
    });
    const coll = awaitUsers.createReactionCollector((reaction, user) => Object.keys(reactions).map((r) => r.split(':')[2].replace('>', '')).includes(reaction.emoji.id) && !user.bot, { time: 360000 });

    const players = [message.author];

    coll.on('collect', async (reaction, user) => {
        if(reaction.emoji.id === '839160370920030299') {
            reaction.users.remove(user).catch(() => {});
            if(Game.findGameByUser(client, user)) return message.channel.send(`⚠️ Vous jouez déjà à un autre jeu ${user} ! Finissez votre partie et vous pourrez participer.`);

            if(players.length >= 10) {
                return message.channel.send(`⚠️ La limite de 10 joueurs a été atteinte ${user} ! Impossible de rejoindre cette partie.`)
                    .then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            const dbU = await User.findOne({ id: user.id });
            if(dbU?.uno_played) {
                if(dbU.uno_played.filter((timestamp) => timestamp + (1000 * 60 * 60 * 24) > Date.now()).length >= 4) return message.channel.send(`⚠️ Vous avez atteint votre limite de 4 parties de Uno par jour ${user} ! Revenez dans 24h ou achetez le premium (\`${data.prefix}premium\`).`);
                dbU.uno_played = dbU.uno_played.filter((timestamp) => timestamp + (1000 * 60 * 60 * 24) < Date.now());
                await dbU.save();
            }

            if(!players.find((u) => u.id === user.id)) {
                players.push(user);
                embed.fields[0].value = players.map((p) => `**- ${p}**`).join('\n');

                await awaitUsers.edit({ embed });
            }
        }

        if(reaction.emoji.id === '839160276657635348') {
            reaction.users.remove(user).catch(() => {});
            if(players.find((u) => u.id === user.id)) {
                if(user.id === message.author.id) return;

                players.splice(players.findIndex((u) => u.id === user.id), 1);
                embed.fields[0].value = players.map((p) => `**- ${p}**`).join('\n');

                await awaitUsers.edit({ embed });
            }                
        }

        if(reaction.emoji.id === '839170531906814022') {
            if(user.id === message.author.id) {
                if(players.length < 2) {
                    reaction.users.remove(user).catch(() => {});
                    return message.channel.send('⚠️ Vous devez être minimum 2 joueurs pour commencer la partie !')
                        .then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
                }

                if(Game.findGameByUser(client, message.author)) return message.channel.send(`⚠️ Vous jouez déjà à un autre jeu ${message.author} ! Finissez votre partie et vous pourrez lancer la partie.`)
                    .then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));

                const game = new Uno(client, message.channel, ...players);
                client.games.push(game);

                // for (let i = 0; i < players.length; i++) {
                //     const dbUser = await User.findOne({ id: players[i].id });
                //     if(dbUser?.uno_played) {
                //         dbUser.uno_played.push(Date.now());
                //         dbUser.markModified('uno_played');
                //         await dbUser.save();
                //     } else {
                //         dbUser.uno_played = [Date.now()];
                //         dbUser.markModified('uno_played');
                //         await dbUser.save();
                //     }
                // }

                awaitUsers.delete().catch(() => {});
                return await game.start();
            }
        }

        if(reaction.emoji.id === '839170641298980884') {
            if(user.id === message.author.id) {
                coll.stop(true);
                awaitUsers.delete().catch(() => {});

                return message.channel.send(`${message.author.tag} a annulé la partie.`);
            }
        }
    });

    coll.on('end', (_, reason) => {
        if(reason === 'time') {
            awaitUsers.reactions.removeAll().catch(() => {});
            return message.channel.send('⚠️ Pas assez de joueurs ont rejoint la partie ou le créateur a mis trop de temps à la lancer, la partie est annulée.');
        }
    });
}

module.exports.help = {
    name: "uno",
    aliases: ["uno"],
    category: "Fun",
    description: "Jouer au Uno !",
    usage: "[help | delete]",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["MANAGE_MESSAGES", "EMBED_LINKS"],
    args: false
}